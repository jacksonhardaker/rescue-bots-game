// Animated 3D Solar System Destination Picker Scene (worldState.activeArea === 'SOLAR_HUB')
import * as THREE from 'three';
import { camera, renderer } from '../rendering/scene.js';
import { toonGrad3 } from '../rendering/materials.js';
import { worldState } from '../state/gameState.js';
import { progression } from '../progression/progression.js';
import { buildCrashedSpaceshipSigma, type SigmaAnimatedEntry } from './spaceshipSigma.js';
import { swapToSpace, startSpaceTransition, setSolarHubHandler } from './space.js';
import { swapToPlanetSurface, restoreRigsFromPlanetSurface, LandablePlanetId } from './planetSurface.js';
import { swapToSaturnRace, restoreRigsFromSaturnRace } from './saturnRace.js';
import { sfx } from '../audio/soundFX.js';
import { SVG_ICONS } from '../ui/icons.js';

export const solarHubScene = new THREE.Scene();

export type SolarDestinationId =
    | 'MERCURY'
    | 'VENUS'
    | 'EARTH'
    | 'MOON'
    | 'MARS'
    | 'JUPITER'
    | 'SATURN'
    | 'URANUS'
    | 'NEPTUNE'
    | 'PLUTO';

export interface SolarDestinationDef {
    id: SolarDestinationId;
    name: string;
    badge: string;
    badgeColor: string;
    gravity: string;
    description: string;
    iconKey: string;
    orbitRadius: number;
    orbitSpeed: number;
    startAngle: number;
    radius: number;
    color: number;
    parentId?: SolarDestinationId;
}

export const SOLAR_DESTINATIONS: SolarDestinationDef[] = [
    {
        id: 'MERCURY',
        name: 'Mercury',
        badge: 'LANDABLE SURFACE',
        badgeColor: '#f59e0b',
        gravity: '0.38G Low-G',
        description: 'Scorched cratered canyons under a giant blazing Sun. Ride solar thermal vents and collect 3 Solar Relics!',
        iconKey: 'PLANET_MERCURY',
        orbitRadius: 30,
        orbitSpeed: 0.28,
        startAngle: 0.7,
        radius: 3.1,
        color: 0xa8a29e
    },
    {
        id: 'VENUS',
        name: 'Venus',
        badge: 'LANDABLE SURFACE',
        badgeColor: '#f97316',
        gravity: '0.90G Heavy Clouds',
        description: 'Golden sulfuric skies and volcanic basalt mesas. Ride thermal plumes and recover 3 Venusian Relics!',
        iconKey: 'PLANET_VENUS',
        orbitRadius: 44,
        orbitSpeed: 0.21,
        startAngle: 2.1,
        radius: 4.3,
        color: 0xf59e0b
    },
    {
        id: 'EARTH',
        name: 'Earth',
        badge: 'HOME BASE',
        badgeColor: '#10b981',
        gravity: '1.00G Griffin Rock',
        description: 'Return through Earth’s atmosphere directly back to Rescue Bots HQ on Griffin Rock Island!',
        iconKey: 'PLANET_EARTH',
        orbitRadius: 60,
        orbitSpeed: 0.16,
        startAngle: 3.7,
        radius: 4.6,
        color: 0x0284c7
    },
    {
        id: 'MOON',
        name: 'The Moon',
        badge: 'ORBIT + LANDABLE',
        badgeColor: '#38bdf8',
        gravity: '0.35G Lunar Base',
        description: 'Earth/Moon Orbital Arena with Dr. Morocco’s Laser Station, Star-Rings, Lunar Rover & 6-Hoop Crater Course!',
        iconKey: 'PLANET_MOON',
        orbitRadius: 10.5,
        orbitSpeed: 0.95,
        startAngle: 0.8,
        radius: 2.3,
        color: 0xcbd5e1,
        parentId: 'EARTH'
    },
    {
        id: 'MARS',
        name: 'Mars',
        badge: 'LANDABLE SURFACE',
        badgeColor: '#ef4444',
        gravity: '0.38G Red Planet',
        description: 'Crimson canyons and swirling dust-devil updrafts. Explore Olympus Outpost and find 3 Martian Relics!',
        iconKey: 'PLANET_MARS',
        orbitRadius: 78,
        orbitSpeed: 0.13,
        startAngle: 5.2,
        radius: 3.8,
        color: 0xdc2626
    },
    {
        id: 'JUPITER',
        name: 'Jupiter',
        badge: 'ORBIT + LANDABLE MOON',
        badgeColor: '#f59e0b',
        gravity: 'Gas Giant (No Landing)',
        description: 'Massive gas giant surrounded by Io, Europa, Ganymede & Callisto! Complete orbital rescues or land on icy Europa!',
        iconKey: 'PLANET_JUPITER',
        orbitRadius: 104,
        orbitSpeed: 0.095,
        startAngle: 1.1,
        radius: 9.2,
        color: 0xd97706
    },
    {
        id: 'SATURN',
        name: 'Saturn',
        badge: 'RING GRAND PRIX',
        badgeColor: '#eab308',
        gravity: 'Ring Circuit Track',
        description: 'Race around Saturn in Vehicle Mode (or transform anytime!) on its shimmering icy rings! Dodge ice rocks and sprint through 12 Turbo Gates!',
        iconKey: 'PLANET_SATURN',
        orbitRadius: 132,
        orbitSpeed: 0.075,
        startAngle: 2.65,
        radius: 7.8,
        color: 0xeab308
    },
    {
        id: 'URANUS',
        name: 'Uranus',
        badge: 'ORBIT + LANDABLE MOON',
        badgeColor: '#06b6d4',
        gravity: 'Ice Giant (No Landing)',
        description: 'Tilted cyan ice giant with vertical rings! Weave through orbital missions or descend onto jagged moon Miranda!',
        iconKey: 'PLANET_URANUS',
        orbitRadius: 156,
        orbitSpeed: 0.06,
        startAngle: 4.3,
        radius: 6.0,
        color: 0x22d3ee
    },
    {
        id: 'NEPTUNE',
        name: 'Neptune',
        badge: 'ORBIT + LANDABLE MOON',
        badgeColor: '#3b82f6',
        gravity: 'Ice Giant (No Landing)',
        description: 'Deep-azure stormy ice giant with supersonic winds! Patrol deep-space orbit or land on cryo-geyser moon Triton!',
        iconKey: 'PLANET_NEPTUNE',
        orbitRadius: 178,
        orbitSpeed: 0.05,
        startAngle: 5.8,
        radius: 5.8,
        color: 0x2563eb
    },
    {
        id: 'PLUTO',
        name: 'Pluto',
        badge: 'LANDABLE SURFACE',
        badgeColor: '#a855f7',
        gravity: '0.18G Super-Floaty',
        description: 'Icy dwarf planet at the edge of the Solar System under Charon! Make giant leaps and find 3 Kuiper Ice Relics!',
        iconKey: 'PLANET_PLUTO',
        orbitRadius: 198,
        orbitSpeed: 0.04,
        startAngle: 0.35,
        radius: 3.1,
        color: 0xd6d3d1
    }
];

interface PlanetNode {
    def: SolarDestinationDef;
    group: THREE.Group;
    hitMesh: THREE.Mesh;
    angle: number;
    worldPos: THREE.Vector3;
}

let _hubBuilt = false;
let _hubSunMesh: THREE.Mesh | null = null;
let _hubSigmaRoot: THREE.Group | null = null;
let _selectionRing: THREE.Mesh | null = null;
let _selectedDestId: SolarDestinationId = 'MOON';
const _planetNodes = new Map<SolarDestinationId, PlanetNode>();
const _hitMeshes: THREE.Mesh[] = [];
const _hubAnimated: SigmaAnimatedEntry[] = [];

// Hyper-warp transition state
const _warpState = {
    active: false,
    destId: 'MOON' as SolarDestinationId,
    timer: 0,
    duration: 1.25
};

const _raycaster = new THREE.Raycaster();
const _pointerNDC = new THREE.Vector2();
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();

function createPlanetMiniTexture(id: SolarDestinationId, baseColor: number): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    const col = new THREE.Color(baseColor);
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(0, 0, 256, 128);

    if (id === 'EARTH') {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath(); ctx.ellipse(70, 56, 34, 22, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(175, 68, 42, 26, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillRect(0, 0, 256, 10);
        ctx.fillRect(0, 118, 256, 10);
    } else if (id === 'JUPITER') {
        const bands = ['#c2410c', '#fef3c7', '#d97706', '#fde68a', '#9a3412', '#fef9c3', '#b45309'];
        bands.forEach((b, i) => {
            ctx.fillStyle = b;
            ctx.fillRect(0, (i / bands.length) * 128, 256, 128 / bands.length + 2);
        });
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.ellipse(165, 78, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'SATURN') {
        const bands = ['#ca8a04', '#fef08a', '#eab308', '#fde047', '#b45309'];
        bands.forEach((b, i) => {
            ctx.fillStyle = b;
            ctx.fillRect(0, (i / bands.length) * 128, 256, 128 / bands.length + 2);
        });
    } else if (id === 'MARS') {
        ctx.fillStyle = '#991b1b';
        ctx.beginPath(); ctx.ellipse(90, 62, 36, 18, 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 256, 9);
    } else if (id === 'VENUS') {
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(0, 32, 256, 18);
        ctx.fillRect(0, 76, 256, 16);
    } else if (id === 'NEPTUNE') {
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(0, 36, 256, 14);
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath(); ctx.ellipse(115, 72, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'PLUTO') {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.arc(122, 66, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(140, 66, 20, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            ctx.arc((i * 47) % 256, 18 + (i * 29) % 92, 5 + (i % 7), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    return new THREE.CanvasTexture(c);
}

function buildSolarHubScene() {
    if (_hubBuilt) return;
    _hubBuilt = true;

    solarHubScene.background = new THREE.Color(0x030712);
    solarHubScene.add(new THREE.HemisphereLight(0xbae6fd, 0x1e1b4b, 0.85));
    const sunPt = new THREE.PointLight(0xfffbeb, 2.4, 650, 0.4);
    sunPt.position.set(0, 6, 0);
    solarHubScene.add(sunPt);
    const dir = new THREE.DirectionalLight(0xffffff, 0.75);
    dir.position.set(80, 140, 120);
    solarHubScene.add(dir);

    // Rich 360 Starfield
    const starCount = 1800;
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 420 + Math.random() * 280;
        sPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        sPos[i * 3 + 1] = r * Math.cos(ph);
        sPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    solarHubScene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.6, fog: false })));

    // Central Glowing Sun
    _hubSunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(16.5, 32, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    const sunCorona1 = new THREE.Mesh(
        new THREE.SphereGeometry(20.5, 28, 20),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.32 })
    );
    const sunCorona2 = new THREE.Mesh(
        new THREE.SphereGeometry(25.5, 24, 18),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.14 })
    );
    _hubSunMesh.add(sunCorona1, sunCorona2);
    solarHubScene.add(_hubSunMesh);

    // Build all 10 orbiting destinations + luminous orbit rings
    SOLAR_DESTINATIONS.forEach(def => {
        if (!def.parentId) {
            const orbitTrack = new THREE.Mesh(
                new THREE.RingGeometry(def.orbitRadius - 0.32, def.orbitRadius + 0.32, 96).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
            );
            solarHubScene.add(orbitTrack);
        }

        const g = new THREE.Group();
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(def.radius, 26, 20),
            new THREE.MeshToonMaterial({ map: createPlanetMiniTexture(def.id, def.color), gradientMap: toonGrad3 })
        );
        g.add(sphere);

        // Iconic Rings & Tiny Moons
        if (def.id === 'SATURN') {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(def.radius * 1.32, def.radius * 2.25, 48).rotateX(-Math.PI / 2),
                new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
            );
            ring.rotation.z = 0.24;
            g.add(ring);
        } else if (def.id === 'URANUS') {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(def.radius * 1.35, def.radius * 1.75, 40),
                new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.52, side: THREE.DoubleSide })
            );
            ring.rotation.y = 0.6;
            g.add(ring);
        } else if (def.id === 'JUPITER') {
            // Tiny Galilean moon dots orbiting Jupiter in the orrery
            [0, 1.6, 3.1, 4.7].forEach((a, idx) => {
                const m = new THREE.Mesh(
                    new THREE.SphereGeometry(0.95, 10, 8),
                    new THREE.MeshBasicMaterial({ color: idx === 0 ? 0xfde047 : (idx === 1 ? 0xbae6fd : 0xcbd5e1) })
                );
                m.position.set(Math.cos(a) * (def.radius + 3.2 + idx * 1.2), 0, Math.sin(a) * (def.radius + 3.2 + idx * 1.2));
                g.add(m);
            });
        } else if (def.id === 'PLUTO') {
            const charon = new THREE.Mesh(
                new THREE.SphereGeometry(1.15, 10, 8),
                new THREE.MeshToonMaterial({ color: 0x94a3b8, gradientMap: toonGrad3 })
            );
            charon.position.set(5.4, 0.8, 0);
            g.add(charon);
        }

        // Generous invisible hit sphere for easy mouse + iPad tapping
        const hitMesh = new THREE.Mesh(
            new THREE.SphereGeometry(Math.max(def.radius * 2.1, 7.5), 12, 10),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        hitMesh.userData.destId = def.id;
        g.add(hitMesh);
        _hitMeshes.push(hitMesh);

        solarHubScene.add(g);
        _planetNodes.set(def.id, {
            def,
            group: g,
            hitMesh,
            angle: def.startAngle,
            worldPos: new THREE.Vector3()
        });
    });

    // Glowing Cyan/Gold Selection Reticle Ring
    _selectionRing = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.14, 8, 32).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    solarHubScene.add(_selectionRing);

    // Starship Sigma hovering heroically in the lower-left foreground!
    _hubSigmaRoot = buildCrashedSpaceshipSigma(solarHubScene, _hubAnimated, null, {
        originX: 0,
        originZ: 0,
        includeDiorama: false,
        flatLevel: true
    });
    _hubSigmaRoot.scale.setScalar(0.36);
    if (_hubSigmaRoot.userData?.sigmaControl) {
        _hubSigmaRoot.userData.sigmaControl.setRepairStage(3);
        _hubSigmaRoot.userData.sigmaControl.setThrusterPower(0.75, false);
        if (_hubSigmaRoot.userData.sigmaControl.launchPadRing) {
            _hubSigmaRoot.userData.sigmaControl.launchPadRing.visible = false;
        }
    }
}

export function selectSolarDestination(destId: SolarDestinationId, playSound = true) {
    _selectedDestId = destId;
    if (playSound) sfx.playWaypointTap?.();
    renderSolarHubUI();
}

export function renderSolarHubUI() {
    const ui = document.getElementById('solar-hub-ui');
    const active = worldState.activeArea === 'SOLAR_HUB';
    if (ui) ui.classList.toggle('hidden', !active);
    if (!active) return;

    const def = SOLAR_DESTINATIONS.find(d => d.id === _selectedDestId) || SOLAR_DESTINATIONS[3];
    const visited: string[] = Array.isArray(progression.visitedPlanets) ? progression.visitedPlanets : [];

    // Update Preview Card
    const iconEl = document.getElementById('solar-card-icon');
    const nameEl = document.getElementById('solar-card-name');
    const badgeEl = document.getElementById('solar-card-badge');
    const gravEl = document.getElementById('solar-card-gravity');
    const descEl = document.getElementById('solar-card-desc');
    const warpBtn = document.getElementById('btn-solar-warp');
    const warpLabel = document.getElementById('solar-warp-label');

    if (iconEl) iconEl.innerHTML = SVG_ICONS[def.iconKey] || SVG_ICONS.SOLAR_SYSTEM;
    if (nameEl) nameEl.textContent = def.name.toUpperCase();
    if (badgeEl) {
        badgeEl.textContent = def.badge;
        badgeEl.style.backgroundColor = def.badgeColor;
        badgeEl.style.color = '#0f172a';
    }
    if (gravEl) gravEl.textContent = def.gravity;
    if (descEl) descEl.textContent = def.description;
    if (warpLabel) {
        warpLabel.textContent = def.id === 'EARTH'
            ? 'RETURN TO GRIFFIN ROCK'
            : (def.id === 'SATURN' ? 'RACE ON SATURN RINGS' : `WARP TO ${def.name.toUpperCase()}`);
    }
    if (warpBtn) {
        (warpBtn as HTMLButtonElement).disabled = _warpState.active;
    }

    // Render 10-Destination Dock Pills
    const dock = document.getElementById('solar-dest-dock');
    if (dock) {
        if (dock.children.length !== SOLAR_DESTINATIONS.length) {
            dock.innerHTML = '';
            SOLAR_DESTINATIONS.forEach(d => {
                const btn = document.createElement('button');
                btn.id = `solar-pill-${d.id}`;
                btn.type = 'button';
                btn.dataset.dest = d.id;
                btn.className = 'tactile-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 text-[11px] font-black tracking-wide cursor-pointer shrink-0 transition-transform';
                btn.style.minHeight = '38px';
                btn.style.touchAction = 'manipulation';
                btn.innerHTML = `
                    <span class="w-5 h-5 flex items-center justify-center shrink-0">${SVG_ICONS[d.iconKey] || SVG_ICONS.SOLAR_SYSTEM}</span>
                    <span class="text-white">${d.name}</span>
                `;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (_warpState.active) return;
                    selectSolarDestination(d.id, true);
                });
                dock.appendChild(btn);
            });
        }

        // Update active highlight & visited indicator
        SOLAR_DESTINATIONS.forEach(d => {
            const btn = document.getElementById(`solar-pill-${d.id}`);
            if (!btn) return;
            const isSel = d.id === _selectedDestId;
            const isVis = visited.includes(d.id);
            btn.style.background = isSel
                ? 'linear-gradient(180deg, #0284c7 0%, #1d4ed8 100%)'
                : (isVis ? 'rgba(15, 23, 42, 0.94)' : 'rgba(30, 41, 59, 0.92)');
            btn.style.borderColor = isSel ? '#fde047' : (isVis ? '#38bdf8' : '#475569');
            btn.style.transform = isSel ? 'translateY(-2px) scale(1.04)' : 'none';
        });
    }
}

export function launchWarpToSelected() {
    if (worldState.activeArea !== 'SOLAR_HUB' || _warpState.active) return;
    _warpState.active = true;
    _warpState.destId = _selectedDestId;
    _warpState.timer = 0;
    sfx.playEnergyCharge();
    sfx.playRankUp();
    renderSolarHubUI();
}

export function handleSolarHubClick(clientX: number, clientY: number): boolean {
    if (worldState.activeArea !== 'SOLAR_HUB' || _warpState.active) return false;
    _pointerNDC.x = (clientX / window.innerWidth) * 2 - 1;
    _pointerNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    _raycaster.setFromCamera(_pointerNDC, camera);
    const hits = _raycaster.intersectObjects(_hitMeshes, false);
    if (hits.length > 0) {
        const destId = hits[0].object.userData?.destId as SolarDestinationId | undefined;
        if (destId) {
            selectSolarDestination(destId, true);
            return true;
        }
    }
    return false;
}

export function swapToSolarHub() {
    buildSolarHubScene();

    // Restore all Bot rigs that might have been attached to PlanetSurface or SaturnRace
    restoreRigsFromPlanetSurface();
    restoreRigsFromSaturnRace();

    worldState.activeArea = 'SOLAR_HUB';
    _warpState.active = false;
    _warpState.timer = 0;

    // Hide all other HUD bars
    const hideIds = [
        'bottom-controls-bar',
        'space-controls-bar',
        'space-hud-pill',
        'moon-hud-pill',
        'cavern-hud-pill',
        'sigma-action-btn',
        'moon-orbit-btn',
        'moon-earth-btn',
        'planet-solar-btn',
        'saturn-race-hud'
    ];
    hideIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const zEl = document.getElementById('zone-label');
    if (zEl) zEl.textContent = 'SOLAR SYSTEM — STARSHIP SIGMA';

    // Reset camera immediately to heroic overview
    camera.fov = 56;
    camera.updateProjectionMatrix();
    camera.position.set(0, 145, 255);
    camera.lookAt(0, 0, 0);

    renderSolarHubUI();
}

function finishWarpToDestination(destId: SolarDestinationId) {
    _warpState.active = false;
    camera.fov = 60;
    camera.updateProjectionMatrix();

    const ui = document.getElementById('solar-hub-ui');
    if (ui) ui.classList.add('hidden');

    if (destId === 'EARTH') {
        startSpaceTransition('TO_EARTH');
    } else if (destId === 'MOON') {
        swapToSpace(false, 'MOON_ORBIT');
    } else if (destId === 'JUPITER') {
        swapToSpace(false, 'JUPITER');
    } else if (destId === 'URANUS') {
        swapToSpace(false, 'URANUS');
    } else if (destId === 'NEPTUNE') {
        swapToSpace(false, 'NEPTUNE');
    } else if (destId === 'SATURN') {
        swapToSaturnRace();
    } else {
        swapToPlanetSurface(destId as LandablePlanetId, null);
    }
}

export function updateSolarHub(dt: number, now: number) {
    if (worldState.activeArea !== 'SOLAR_HUB') return;
    const nowSec = now * 0.001;

    if (_hubSunMesh) {
        _hubSunMesh.rotation.y += dt * 0.25;
        const pulse = 1.0 + Math.sin(nowSec * 2.5) * 0.03;
        _hubSunMesh.scale.setScalar(pulse);
    }

    // Orbit all planets (with Earth's Moon orbiting Earth!)
    const earthNode = _planetNodes.get('EARTH');
    _planetNodes.forEach(node => {
        node.angle += dt * node.def.orbitSpeed;
        if (node.def.parentId === 'EARTH' && earthNode) {
            node.worldPos.set(
                earthNode.worldPos.x + Math.cos(node.angle) * node.def.orbitRadius,
                Math.sin(node.angle * 1.5) * 1.4,
                earthNode.worldPos.z + Math.sin(node.angle) * node.def.orbitRadius
            );
        } else {
            node.worldPos.set(
                Math.cos(node.angle) * node.def.orbitRadius,
                0,
                Math.sin(node.angle) * node.def.orbitRadius
            );
        }
        node.group.position.copy(node.worldPos);
        node.group.rotation.y += dt * 0.45;
    });

    const selectedNode = _planetNodes.get(_selectedDestId) || _planetNodes.get('MOON')!;

    // Update glowing selection reticle around selected planet
    if (_selectionRing && selectedNode) {
        _selectionRing.position.copy(selectedNode.worldPos);
        const ringScale = selectedNode.def.radius * 1.55 + Math.sin(nowSec * 4.2) * 0.35;
        _selectionRing.scale.setScalar(ringScale);
        _selectionRing.rotation.z += dt * 1.4;
    }

    // Position Starship Sigma in the heroic foreground pointing toward the selected destination
    if (_hubSigmaRoot && selectedNode) {
        _hubSigmaRoot.position.set(-48, 86 + Math.sin(nowSec * 2.2) * 2.0, 178);
        _hubSigmaRoot.lookAt(selectedNode.worldPos);
    }

    // Camera framing or Hyper-Warp dive!
    if (_warpState.active && selectedNode) {
        _warpState.timer += dt;
        const p = Math.min(1, _warpState.timer / _warpState.duration);
        const ease = p * p * (3 - 2 * p);
        _camGoal.lerpVectors(new THREE.Vector3(0, 130, 240), selectedNode.worldPos, ease * 0.85);
        camera.position.lerp(_camGoal, Math.min(1, dt * 8));
        camera.lookAt(selectedNode.worldPos);
        camera.fov = THREE.MathUtils.lerp(56, 86, ease);
        camera.updateProjectionMatrix();
        if (_hubSigmaRoot?.userData?.sigmaControl) {
            _hubSigmaRoot.userData.sigmaControl.setThrusterPower(2.4, true);
        }
        if (p >= 1) {
            finishWarpToDestination(_warpState.destId);
        }
    } else if (selectedNode) {
        // Gentle orbital overview biased smoothly toward the selected planet
        _camGoal.set(
            selectedNode.worldPos.x * 0.32,
            128 + selectedNode.def.orbitRadius * 0.16,
            232 + selectedNode.worldPos.z * 0.18
        );
        camera.position.lerp(_camGoal, Math.min(1, dt * 3.0));
        _lookGoal.set(
            selectedNode.worldPos.x * 0.48,
            selectedNode.worldPos.y,
            selectedNode.worldPos.z * 0.48
        );
        camera.lookAt(_lookGoal);
    }
}

// Register swapToSolarHub with space.ts so launching Sigma from Caverns enters the 3D Solar System Hub!
setSolarHubHandler(swapToSolarHub);

if (typeof window !== 'undefined') {
    Object.assign(window, {
        solarHubScene,
        SOLAR_DESTINATIONS,
        swapToSolarHub,
        selectSolarDestination,
        launchWarpToSelected,
        handleSolarHubClick
    });
}

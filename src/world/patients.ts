// Medical Rescue Feature: Hurt / Medical-Need Citizens across Griffin Rock Surface & Underground Caverns
// Approaching shows a speech bubble explaining why they need the hospital (from sprained ankles to having a baby!).
// Ratchet can pick up to 3 patients at once and deliver them to Griffin Rock General Hospital for Hero Points & Energon.
import * as THREE from 'three';
import { getTerrainHeight } from './terrain.js';
import { createHumanNPCMesh } from './npcModels.js';
import { toonGrad3, applyCartoonInkOutlines } from '../rendering/materials.js';
import { player, worldState } from '../state/gameState.js';
import { progression, saveProgression, syncProgressionHUD } from '../progression/progression.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech, showToast, type SpeechTarget } from '../ui/dialogs.js';
import { spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import { HOSPITAL_DROPOFF_PAD, HOSPITAL_POS } from './buildings.js';
import { SVG_ICONS } from '../ui/icons.js';

export const MAX_CARRIED_PATIENTS = 3;

export interface PatientScenario {
    category: 'MATERNITY' | 'INJURY' | 'ILLNESS' | 'CAVERN';
    shortLabel: string;
    role: string;
    reasonLine: string;
    thankYouLine: string;
    voicePitch: number;
}

export interface PatientSiteDef {
    id: string;
    area: 'SURFACE' | 'UNDERGROUND';
    zoneName: string;
    x: number;
    z: number;
}

export interface ActivePatientEntry {
    id: string;
    siteId: string;
    area: 'SURFACE' | 'UNDERGROUND';
    zoneName: string;
    name: string;
    role: string;
    category: PatientScenario['category'];
    shortLabel: string;
    reasonLine: string;
    thankYouLine: string;
    voicePitch: number;
    x: number;
    y: number;
    z: number;
    state: 'WAITING' | 'CARRIED' | 'RESPAWNING';
    respawnTimer: number;
    lastSpeechTime: number;
    lastNonRatchetHintTime: number;
    phase: number;
    root: THREE.Group;
    rig: ReturnType<typeof createHumanNPCMesh>;
    crossPivot: THREE.Group;
    groundRing: THREE.Mesh;
}

export interface CarriedPatientInfo {
    id: string;
    name: string;
    role: string;
    category: PatientScenario['category'];
    shortLabel: string;
    thankYouLine: string;
    voicePitch: number;
    fromUnderground: boolean;
}

const CITIZEN_NAMES = [
    'Hannah', 'Marcus', 'Clara', 'Owen', 'Sofia', 'Leo',
    'Maya', 'Ben', 'Nora', 'Eli', 'Chloe', 'Sam',
    'Tessa', 'Noah', 'Zoe', 'Gabe'
];

const SURFACE_SCENARIOS: PatientScenario[] = [
    {
        category: 'MATERNITY',
        shortLabel: 'Having a Baby!',
        role: 'Expecting Mom • Urgent Maternity',
        reasonLine: "Ooh! The baby is coming RIGHT NOW! Ratchet, rush me to Griffin Rock General Hospital!",
        thankYouLine: "Thank you, Ratchet! We made it just in time — it's a healthy baby!",
        voicePitch: 1.24
    },
    {
        category: 'MATERNITY',
        shortLabel: 'Baby on the Way!',
        role: 'Expecting Mom • Maternity Run',
        reasonLine: "It's baby time! Please get me to the Griffin Rock Hospital maternity ward right away!",
        thankYouLine: "You're a true hero, Ratchet! Welcome to Griffin Rock, little one!",
        voicePitch: 1.18
    },
    {
        category: 'INJURY',
        shortLabel: 'Twisted Ankle',
        role: 'Injured Hiker • Medical Need',
        reasonLine: "Ow! I twisted my ankle hiking the trail — can Ratchet give me a ride to the hospital?",
        thankYouLine: "My ankle is wrapped up and feeling much better! Thanks, Ratchet!",
        voicePitch: 0.96
    },
    {
        category: 'INJURY',
        shortLabel: 'Scraped Knee',
        role: 'Injured Skater • Medical Need',
        reasonLine: "Oof! I wiped out on my skateboard and scraped my knee bad! Help, Ratchet!",
        thankYouLine: "Bandaged up and good as new! Next time I'm wearing extra knee pads!",
        voicePitch: 1.14
    },
    {
        category: 'ILLNESS',
        shortLabel: 'High Fever',
        role: 'Sick Citizen • Medical Need',
        reasonLine: "Achoo! I've got a super-high fever and the sniffles! Please take me to the doctor!",
        thankYouLine: "The hospital doctors fixed me right up! Thank you, Ratchet!",
        voicePitch: 1.05
    },
    {
        category: 'INJURY',
        shortLabel: 'Giant Bee Sting',
        role: 'Injured Gardener • Medical Need',
        reasonLine: "Yowch! A giant Griffin Rock bumblebee stung my hand and it puffed up! Need an ambulance!",
        thankYouLine: "The swelling went right down! Best ambulance ride ever, Ratchet!",
        voicePitch: 0.92
    },
    {
        category: 'ILLNESS',
        shortLabel: 'Tummy Ache',
        role: 'Diner Patron • Medical Need',
        reasonLine: "Ugh... I ate three triple-decker Diner burgers and my tummy hurts! Hospital, please!",
        thankYouLine: "Whew, my stomach feels so much better now! Thanks for the lift, Ratchet!",
        voicePitch: 0.88
    },
    {
        category: 'INJURY',
        shortLabel: 'Sore Back',
        role: 'Harbor Fisher • Medical Need',
        reasonLine: "Oof! I pulled my back hauling heavy lobster traps! Can you get me to the hospital?",
        thankYouLine: "My back is patched up and ready for the harbor again! Thanks, Ratchet!",
        voicePitch: 0.84
    },
    {
        category: 'INJURY',
        shortLabel: 'Sprained Wrist',
        role: 'Boardwalk Visitor • Medical Need',
        reasonLine: "Ouch! I slipped near the boardwalk and sprained my wrist! Ratchet, I need a ride!",
        thankYouLine: "Got a brand new splint at the hospital — you saved my day, Ratchet!",
        voicePitch: 1.12
    }
];

const UNDERGROUND_SCENARIOS: PatientScenario[] = [
    {
        category: 'CAVERN',
        shortLabel: 'Cavern Ankle Sprain',
        role: 'Injured Explorer • Underground',
        reasonLine: "Ow! I tripped over an Energon crystal down here and sprained my ankle! Take me up to the hospital!",
        thankYouLine: "What a rescue from the deep caverns! Thank you, Ratchet!",
        voicePitch: 0.95
    },
    {
        category: 'MATERNITY',
        shortLabel: 'Cavern Baby Delivery!',
        role: 'Cavern Guide • Urgent Maternity',
        reasonLine: "Oh my! My baby decided to arrive right in the middle of our cavern tour! Rush me to the surface hospital!",
        thankYouLine: "We made it out of the caverns just in time — welcome to our little cavern baby!",
        voicePitch: 1.22
    },
    {
        category: 'CAVERN',
        shortLabel: 'Bumped Head',
        role: 'Spelunker • Underground Injury',
        reasonLine: "Whoa, a friendly cavern dino startled me and I bumped my head! Please get me to the hospital!",
        thankYouLine: "No dizziness left at all! Thanks for getting me back to Griffin Rock Hospital!",
        voicePitch: 1.08
    },
    {
        category: 'CAVERN',
        shortLabel: 'Cavern Dust Cough',
        role: 'Geologist • Underground Medical',
        reasonLine: "Cough! Cough! I breathed in too much cavern rock dust — Ratchet, get me to the hospital!",
        thankYouLine: "Fresh air and clean lungs! Thanks for the underground medevac, Ratchet!",
        voicePitch: 0.90
    },
    {
        category: 'CAVERN',
        shortLabel: 'Twisted Knee',
        role: 'Tunnel Scout • Underground Injury',
        reasonLine: "Ouch! I twisted my knee exploring the underground maze! Can Ratchet carry me to the hospital?",
        thankYouLine: "Safe at the hospital! I'm so glad Ratchet came down into the tunnels for me!",
        voicePitch: 1.15
    }
];

export const SURFACE_PATIENT_SITES: PatientSiteDef[] = [
    { id: 'surf_plaza_park',    area: 'SURFACE', zoneName: 'Town Plaza Park',         x: -22,   z: 92 },
    { id: 'surf_diner_walk',    area: 'SURFACE', zoneName: 'Griffin Diner Sidewalk',  x: 64,    z: 10 },
    { id: 'surf_harbor_quay',   area: 'SURFACE', zoneName: 'South Harbor Pier',       x: -20,   z: 1138 },
    { id: 'surf_boardwalk',     area: 'SURFACE', zoneName: 'Sunny Sands Boardwalk',   x: -792,  z: 792 },
    { id: 'surf_west_tech',     area: 'SURFACE', zoneName: 'West Tech Plaza',         x: -1104, z: 58 },
    { id: 'surf_observatory',   area: 'SURFACE', zoneName: 'North Observatory',       x: 34,    z: -1108 },
    { id: 'surf_lighthouse',    area: 'SURFACE', zoneName: 'East Lighthouse Trail',   x: 1276,  z: 52 },
    { id: 'surf_dino_ridge',    area: 'SURFACE', zoneName: 'Dino Ridge Trailhead',    x: -718,  z: -714 },
    { id: 'surf_pine_camp',     area: 'SURFACE', zoneName: 'Pine Valley Campsite',    x: -340,  z: -345 },
    { id: 'surf_wayward_view',  area: 'SURFACE', zoneName: 'Wayward Island Overlook', x: 1928,  z: 518 }
];

// Coordinates sit cleanly in open walkable chambers of the 13x13 (cellSize=36) Griffin Rock Caverns
export const UNDERGROUND_PATIENT_SITES: PatientSiteDef[] = [
    { id: 'ug_drill_hub',      area: 'UNDERGROUND', zoneName: 'Griffin Drill Hub',        x: 14,   z: 14 },
    { id: 'ug_east_shaft',     area: 'UNDERGROUND', zoneName: 'East Quarry Chamber',      x: 174,  z: -68 },
    { id: 'ug_crystal_cache',  area: 'UNDERGROUND', zoneName: 'Crystal Cache Approach',   x: 114,  z: -116 },
    { id: 'ug_dino_shrine',    area: 'UNDERGROUND', zoneName: 'Dinobot Shrine Rim',       x: -168, z: -12 },
    { id: 'ug_timber_shaft',   area: 'UNDERGROUND', zoneName: 'Timber Creek Chamber',     x: -102, z: 68 }
];

// Underground exit shaft positions (mirrors underground.ts shaftLocations for live compass guidance)
const UNDERGROUND_EXIT_SHAFTS = [
    { name: 'Griffin Shaft Lift', x: -12, z: -12 },
    { name: 'East Quarry Exit', x: 180, z: -72 },
    { name: 'Timber Creek Exit', x: -108, z: 72 }
];

const SKIN_TONES = [0xfde68a, 0xfdba74, 0xd97706, 0x92400e, 0xfecdd3];
const SHIRT_COLORS = [0x2563eb, 0x16a34a, 0xf97316, 0x9333ea, 0xec4899, 0x0ea5e9, 0xeab308];
const HAIR_COLORS = [0x1e293b, 0x78350f, 0xd97706, 0x451a03, 0x991b1b];

const _surfacePatients: ActivePatientEntry[] = [];
const _undergroundPatients: ActivePatientEntry[] = [];
const _carriedPatients: CarriedPatientInfo[] = [];

// Brief celebrating citizen mesh at the Hospital ER doors after drop-off
let _celebrationMesh: THREE.Group | null = null;
let _celebrationTimer = 0;

let _hudEl: HTMLElement | null = null;
let _hudCountEl: HTMLElement | null = null;
let _hudReasonEl: HTMLElement | null = null;
let _hudNavEl: HTMLElement | null = null;
let _hudIconEl: HTMLElement | null = null;

const COMPASS_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function createPatientNPCMesh(category: PatientScenario['category'] = 'INJURY', seed = 0) {
    const isMaternity = category === 'MATERNITY';
    const skinColor = SKIN_TONES[seed % SKIN_TONES.length];
    const shirtColor = isMaternity ? 0xec4899 : SHIRT_COLORS[(seed * 3) % SHIRT_COLORS.length];
    const hairColor = HAIR_COLORS[(seed * 5) % HAIR_COLORS.length];

    const rig = createHumanNPCMesh({
        skinColor,
        shirtColor,
        pantsColor: 0x1e293b,
        hairColor,
        indicatorColor: isMaternity ? 0xf472b6 : 0xef4444,
        hasVisorHat: category === 'CAVERN'
    });

    // Replace default radioGem with a crisp pulsing 3D Red-and-White Medical Cross Beacon!
    rig.radioGem.visible = false;

    const matBandage = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: toonGrad3 });
    const matMedRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const matMedWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const matMaternityTint = new THREE.MeshToonMaterial({ color: 0xf472b6, gradientMap: toonGrad3 });

    if (isMaternity) {
        // Cute sculpted maternity dress bump silhouette
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 10), matMaternityTint);
        bump.position.set(0, 1.85, 0.36);
        bump.scale.set(0.95, 0.92, 0.85);
        rig.root.add(bump);
    } else {
        // White medical head bandage wrap or arm sling bandage
        const headWrap = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.28, 1.04), matBandage);
        headWrap.position.set(0, 3.74, 0);
        rig.root.add(headWrap);
        const armWrap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.46), matBandage);
        armWrap.position.set(0, -0.52, 0);
        rig.leftArmPivot.add(armWrap);
    }

    // Floating 3D Medical Cross Beacon above citizen's head
    const crossPivot = new THREE.Group();
    crossPivot.position.set(0, 5.1, 0);
    const backing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 0.24), matMedWhite);
    backing.userData.noOutline = true;
    const cV = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.96, 0.34), matMedRed);
    cV.userData.noOutline = true;
    const cH = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.36, 0.34), matMedRed);
    cH.userData.noOutline = true;
    crossPivot.add(backing, cV, cH);
    rig.root.add(crossPivot);

    // Ground Pulsing Medical Beacon Ring
    const groundRing = new THREE.Mesh(
        new THREE.RingGeometry(1.8, 2.55, 24).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({
            color: isMaternity ? 0xf472b6 : 0xef4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
        })
    );
    groundRing.position.y = 0.14;
    groundRing.userData.noOutline = true;

    const root = new THREE.Group();
    root.add(rig.root, groundRing);
    applyCartoonInkOutlines(rig.root, 1.04, false);

    return { root, rig, crossPivot, groundRing };
}

function pickScenario(area: 'SURFACE' | 'UNDERGROUND', idx: number, forceMaternity = false): PatientScenario {
    const pool = area === 'UNDERGROUND' ? UNDERGROUND_SCENARIOS : SURFACE_SCENARIOS;
    if (forceMaternity) {
        const mat = pool.find(s => s.category === 'MATERNITY');
        if (mat) return mat;
    }
    return pool[idx % pool.length];
}

function assignRandomScenario(p: ActivePatientEntry, seedOffset = 0) {
    const pool = p.area === 'UNDERGROUND' ? UNDERGROUND_SCENARIOS : SURFACE_SCENARIOS;
    const sc = pool[Math.floor(Math.random() * pool.length + seedOffset) % pool.length];
    p.name = CITIZEN_NAMES[Math.floor(Math.random() * CITIZEN_NAMES.length)];
    p.role = sc.role;
    p.category = sc.category;
    p.shortLabel = sc.shortLabel;
    p.reasonLine = sc.reasonLine;
    p.thankYouLine = sc.thankYouLine;
    p.voicePitch = sc.voicePitch;
}

export function initSurfacePatients(targetScene: THREE.Scene) {
    _surfacePatients.forEach(p => targetScene.remove(p.root));
    _surfacePatients.length = 0;

    // Activate 6 initial patients across Griffin Rock (always guaranteeing at least 1 maternity case & 1 right near Town Plaza!)
    const activeIndices = [0, 1, 2, 3, 4, 7];
    SURFACE_PATIENT_SITES.forEach((site, idx) => {
        const isInitiallyActive = activeIndices.includes(idx);
        const sc = pickScenario('SURFACE', idx, idx === 1);
        const built = createPatientNPCMesh(sc.category, idx + 1);
        const gy = Math.max(0.5, getTerrainHeight(site.x, site.z));
        built.root.position.set(site.x, gy, site.z);
        built.root.visible = isInitiallyActive;
        targetScene.add(built.root);

        _surfacePatients.push({
            id: `pat_${site.id}`,
            siteId: site.id,
            area: 'SURFACE',
            zoneName: site.zoneName,
            name: CITIZEN_NAMES[idx % CITIZEN_NAMES.length],
            role: sc.role,
            category: sc.category,
            shortLabel: sc.shortLabel,
            reasonLine: sc.reasonLine,
            thankYouLine: sc.thankYouLine,
            voicePitch: sc.voicePitch,
            x: site.x,
            y: gy,
            z: site.z,
            state: isInitiallyActive ? 'WAITING' : 'RESPAWNING',
            respawnTimer: isInitiallyActive ? 0 : 18 + idx * 6,
            lastSpeechTime: -99,
            lastNonRatchetHintTime: -99,
            phase: idx * 1.15,
            root: built.root,
            rig: built.rig,
            crossPivot: built.crossPivot,
            groundRing: built.groundRing
        });
    });

    // Happy celebratory citizen standing briefly at Hospital ER entrance upon delivery
    if (_celebrationMesh) targetScene.remove(_celebrationMesh);
    const celeb = createHumanNPCMesh({
        skinColor: 0xfde68a,
        shirtColor: 0x34d399,
        pantsColor: 0x1e293b,
        hairColor: 0x78350f,
        indicatorColor: 0x34d399
    });
    const hy = getTerrainHeight(HOSPITAL_POS.x + 6, HOSPITAL_POS.z + 17);
    celeb.root.position.set(HOSPITAL_POS.x + 6, hy + 0.45, HOSPITAL_POS.z + 17);
    celeb.root.visible = false;
    targetScene.add(celeb.root);
    _celebrationMesh = celeb.root;
    _celebrationTimer = 0;

    syncPatientTransportHUD();
}

export function initUndergroundPatients(cavernParent: THREE.Object3D) {
    _undergroundPatients.forEach(p => cavernParent.remove(p.root));
    _undergroundPatients.length = 0;

    // 3 active underground patients initially (always including 1 maternity cavern guide + 1 right near Drill Hub!)
    const activeIndices = [0, 1, 3];
    UNDERGROUND_PATIENT_SITES.forEach((site, idx) => {
        const isInitiallyActive = activeIndices.includes(idx);
        const sc = pickScenario('UNDERGROUND', idx, idx === 1);
        const built = createPatientNPCMesh(sc.category, idx + 11);
        // cavernWorldGroup is elevated by +1.0m in world Y, so local Y = 0.05 puts feet flush on cavern floor
        built.root.position.set(site.x, 0.05, site.z);
        built.root.visible = isInitiallyActive;
        cavernParent.add(built.root);

        _undergroundPatients.push({
            id: `pat_${site.id}`,
            siteId: site.id,
            area: 'UNDERGROUND',
            zoneName: site.zoneName,
            name: CITIZEN_NAMES[(idx + 7) % CITIZEN_NAMES.length],
            role: sc.role,
            category: sc.category,
            shortLabel: sc.shortLabel,
            reasonLine: sc.reasonLine,
            thankYouLine: sc.thankYouLine,
            voicePitch: sc.voicePitch,
            x: site.x,
            y: 1.05, // World-space Y including cavernWorldGroup.position.y = 1.0 (for speech bubble projection!)
            z: site.z,
            state: isInitiallyActive ? 'WAITING' : 'RESPAWNING',
            respawnTimer: isInitiallyActive ? 0 : 22 + idx * 8,
            lastSpeechTime: -99,
            lastNonRatchetHintTime: -99,
            phase: idx * 1.4,
            root: built.root,
            rig: built.rig,
            crossPivot: built.crossPivot,
            groundRing: built.groundRing
        });
    });
}

function boardPatient(p: ActivePatientEntry) {
    if (_carriedPatients.length >= MAX_CARRIED_PATIENTS) return false;
    p.state = 'CARRIED';
    p.root.visible = false;

    _carriedPatients.push({
        id: p.id,
        name: p.name,
        role: p.role,
        category: p.category,
        shortLabel: p.shortLabel,
        thankYouLine: p.thankYouLine,
        voicePitch: p.voicePitch,
        fromUnderground: p.area === 'UNDERGROUND'
    });

    sfx.playMedScan();
    spawnBurstParticles(p.x, p.y + 2.0, p.z, 0x22d3ee, 18, 1.4);
    spawnSparkleGlints(p.x, p.y + 2.2, p.z, 16);

    const onboardCount = _carriedPatients.length;
    const isMat = p.category === 'MATERNITY';
    const destinationHint = p.area === 'UNDERGROUND'
        ? 'Head for a Sunlit Exit Shaft, then rush to Griffin Rock Hospital!'
        : 'Rush to Griffin Rock General Hospital Ambulance Bay!';

    showToast(
        `PATIENT ONBOARD (${onboardCount}/${MAX_CARRIED_PATIENTS})`,
        `${p.name} (${p.shortLabel}) — ${destinationHint}`
    );

    const ratchetLine = isMat
        ? `Hold tight, ${p.name}! Baby on the way — sirens on, rushing straight to Griffin Rock General Hospital!`
        : (p.area === 'UNDERGROUND'
            ? `Got you safely aboard, ${p.name}! Heading up out of the caverns to Griffin Rock General Hospital!`
            : `Easy there, ${p.name}! Vital signs stabilized — taking you straight to Griffin Rock General Hospital!`);

    triggerNPCSpeech('RATCHET', 'Autobot Chief Medical Officer', ratchetLine, player as unknown as SpeechTarget, true, true);
    syncPatientTransportHUD();
    return true;
}

export function triggerRatchetMedScannerPickup(scanRadius = 18.5): number {
    const activeList = worldState.activeArea === 'UNDERGROUND' ? _undergroundPatients : _surfacePatients;
    let picked = 0;
    for (let i = 0; i < activeList.length; i++) {
        if (_carriedPatients.length >= MAX_CARRIED_PATIENTS) break;
        const p = activeList[i];
        if (p.state !== 'WAITING') continue;
        const dist = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
        if (dist <= scanRadius) {
            if (boardPatient(p)) picked++;
        }
    }
    return picked;
}

function deliverCarriedPatientsToHospital() {
    if (_carriedPatients.length === 0) return;

    const delivered = [..._carriedPatients];
    _carriedPatients.length = 0;

    let totalEnergon = 0;
    let totalHeroBonus = 0;
    let undergroundCount = 0;

    delivered.forEach(info => {
        totalEnergon += 15;
        totalHeroBonus += 5;
        if (info.fromUnderground) {
            undergroundCount++;
            totalEnergon += 10;
            totalHeroBonus += 5;
        }
        // Mark the patient slot to respawn later with a fresh citizen & scenario
        const slot = _surfacePatients.find(p => p.id === info.id) || _undergroundPatients.find(p => p.id === info.id);
        if (slot) {
            slot.state = 'RESPAWNING';
            slot.respawnTimer = 24 + Math.random() * 12;
        }
    });

    progression.totalPatientsDelivered = (progression.totalPatientsDelivered || 0) + delivered.length;
    progression.totalCitizensRescued = (progression.totalCitizensRescued || 0) + delivered.length;
    progression.totalEnergonCubes = (progression.totalEnergonCubes || 0) + totalEnergon;
    saveProgression({ immediate: true });
    syncProgressionHUD();

    sfx.playHospitalDelivery();
    const fxX = HOSPITAL_DROPOFF_PAD.x;
    const fxY = getTerrainHeight(fxX, HOSPITAL_DROPOFF_PAD.z) + 2.4;
    const fxZ = HOSPITAL_DROPOFF_PAD.z;
    spawnBurstParticles(fxX, fxY, fxZ, 0x34d399, 32, 2.0);
    spawnSparkleGlints(fxX, fxY + 1.0, fxZ, 28);

    if (_celebrationMesh) {
        _celebrationMesh.visible = true;
        _celebrationTimer = 6.5;
    }

    const lead = delivered[0];
    const bonusText = undergroundCount > 0 ? ' (incl. Cavern Medevac Bonus!)' : '';
    showToast(
        `HOSPITAL DELIVERY COMPLETE! (+${totalHeroBonus} PTS)`,
        `${delivered.length} patient${delivered.length > 1 ? 's' : ''} safely admitted! +${totalEnergon} Energon${bonusText}`
    );

    const speechTarget = _celebrationMesh
        ? { x: HOSPITAL_POS.x + 6, y: fxY, z: HOSPITAL_POS.z + 17, voicePitch: lead.voicePitch }
        : (player as unknown as SpeechTarget);
    triggerNPCSpeech(lead.name, 'Grateful Patient', lead.thankYouLine, speechTarget, true, true);

    syncPatientTransportHUD();
}

export function getNearestExitShaftFrom(x: number, z: number) {
    let best = UNDERGROUND_EXIT_SHAFTS[0];
    let bestDist = Infinity;
    for (let i = 0; i < UNDERGROUND_EXIT_SHAFTS.length; i++) {
        const sh = UNDERGROUND_EXIT_SHAFTS[i];
        const d = Math.hypot(x - sh.x, z - sh.z);
        if (d < bestDist) {
            bestDist = d;
            best = sh;
        }
    }
    return { ...best, dist: bestDist };
}

export function setWaypointToPatientDestination() {
    if (_carriedPatients.length === 0) return;
    if (worldState.activeArea === 'UNDERGROUND') {
        const sh = getNearestExitShaftFrom(player.pos.x, player.pos.z);
        player.waypoint.set(sh.x, 1.0, sh.z);
        player.hasWaypoint = true;
        if (window.waypointGroup) {
            window.waypointGroup.position.set(sh.x, 1.0, sh.z);
            window.waypointGroup.visible = true;
        }
        sfx.playWaypointTap();
        showToast('EXIT SHAFT WAYPOINT SET', `Head to ${sh.name} to bring patients to Griffin Rock Hospital!`);
    } else if (worldState.activeArea === 'SURFACE') {
        const gy = getTerrainHeight(HOSPITAL_DROPOFF_PAD.x, HOSPITAL_DROPOFF_PAD.z);
        player.waypoint.set(HOSPITAL_DROPOFF_PAD.x, gy, HOSPITAL_DROPOFF_PAD.z);
        player.hasWaypoint = true;
        if (window.waypointGroup) {
            window.waypointGroup.position.set(HOSPITAL_DROPOFF_PAD.x, gy, HOSPITAL_DROPOFF_PAD.z);
            window.waypointGroup.visible = true;
        }
        sfx.playWaypointTap();
        showToast('HOSPITAL WAYPOINT SET', 'Autopilot locked onto Griffin Rock General Hospital Ambulance Bay!');
    }
}

export function syncPatientTransportHUD() {
    if (typeof document === 'undefined') return;
    if (!_hudEl) _hudEl = document.getElementById('patient-transport-hud');
    if (!_hudEl) return;

    const show = _carriedPatients.length > 0 && (worldState.activeArea === 'SURFACE' || worldState.activeArea === 'UNDERGROUND');
    if (!show) {
        _hudEl.classList.add('hidden');
        return;
    }
    _hudEl.classList.remove('hidden');

    if (!_hudCountEl) _hudCountEl = document.getElementById('patient-hud-count');
    if (!_hudReasonEl) _hudReasonEl = document.getElementById('patient-hud-reason');
    if (!_hudNavEl) _hudNavEl = document.getElementById('patient-hud-nav');
    if (!_hudIconEl) _hudIconEl = document.getElementById('patient-hud-icon');

    if (_hudIconEl && !_hudIconEl.innerHTML) {
        _hudIconEl.innerHTML = SVG_ICONS.MED_CROSS || '';
    }

    if (_hudCountEl) {
        _hudCountEl.textContent = `AMBULANCE ONBOARD: ${_carriedPatients.length}/${MAX_CARRIED_PATIENTS}`;
    }

    if (_hudReasonEl) {
        const labels = _carriedPatients.map(c => `${c.name}: ${c.shortLabel}`);
        _hudReasonEl.textContent = labels.join(' • ');
    }

    if (_hudNavEl) {
        if (worldState.activeArea === 'UNDERGROUND') {
            const sh = getNearestExitShaftFrom(player.pos.x, player.pos.z);
            const ang = Math.atan2(sh.x - player.pos.x, -(sh.z - player.pos.z));
            const dir = COMPASS_DIRS[((Math.round((ang * 8) / (Math.PI * 2)) % 8) + 8) % 8];
            _hudNavEl.textContent = `EXIT SHAFT • ${Math.round(sh.dist)}m ${dir}`;
        } else {
            const dx = HOSPITAL_DROPOFF_PAD.x - player.pos.x;
            const dz = HOSPITAL_DROPOFF_PAD.z - player.pos.z;
            const dist = Math.hypot(dx, dz);
            const ang = Math.atan2(dx, -dz);
            const dir = COMPASS_DIRS[((Math.round((ang * 8) / (Math.PI * 2)) % 8) + 8) % 8];
            const botNote = player.botType === 'RATCHET' ? 'HOSPITAL' : 'SWITCH TO RATCHET • HOSPITAL';
            _hudNavEl.textContent = `${botNote} • ${Math.round(dist)}m ${dir}`;
        }
    }
}

export function updatePatients(dt: number, now: number) {
    const nowSec = now * 0.001;
    const isSurface = worldState.activeArea === 'SURFACE';
    const isUnderground = worldState.activeArea === 'UNDERGROUND';
    if (!isSurface && !isUnderground) {
        syncPatientTransportHUD();
        return;
    }

    // 1. Tick respawn timers across both Surface and Underground pools
    const tickPoolRespawns = (pool: ActivePatientEntry[], maxActive: number) => {
        const activeCount = pool.filter(p => p.state === 'WAITING').length;
        let canSpawn = Math.max(0, maxActive - activeCount);
        for (let i = 0; i < pool.length; i++) {
            const p = pool[i];
            if (p.state === 'RESPAWNING') {
                p.respawnTimer -= dt;
                if (p.respawnTimer <= 0 && canSpawn > 0) {
                    const distToPlayer = (p.area === worldState.activeArea)
                        ? Math.hypot(player.pos.x - p.x, player.pos.z - p.z)
                        : 999;
                    if (distToPlayer > 45) {
                        assignRandomScenario(p, i);
                        p.state = 'WAITING';
                        p.root.visible = true;
                        p.lastSpeechTime = -99;
                        canSpawn--;
                    }
                }
            }
        }
    };
    tickPoolRespawns(_surfacePatients, 6);
    tickPoolRespawns(_undergroundPatients, 3);

    // 2. Animate & Check Proximity on Active Scene's Patients
    const activePool = isUnderground ? _undergroundPatients : _surfacePatients;
    for (let i = 0; i < activePool.length; i++) {
        const p = activePool[i];
        if (p.state !== 'WAITING' || !p.root.visible) continue;

        const dx = player.pos.x - p.x;
        const dz = player.pos.z - p.z;
        const dist = Math.hypot(dx, dz);

        // Animate floating 3D Medical Cross & pulsing beacon ring
        p.crossPivot.rotation.y += dt * 2.1;
        p.crossPivot.position.y = 5.05 + Math.sin(nowSec * 3.4 + p.phase) * 0.28;
        const ringPulse = 1.0 + Math.sin(nowSec * 4.5 + p.phase) * 0.14;
        p.groundRing.scale.setScalar(ringPulse);

        if (dist < 140) {
            // Face the approaching Rescue Bot and wave urgently!
            p.rig.root.rotation.y = Math.atan2(dx, dz);
            const waveOsc = Math.sin(nowSec * 10.5 + p.phase) * 0.42;
            p.rig.leftArmPivot.rotation.x = -Math.PI * 0.82;
            p.rig.rightArmPivot.rotation.x = -Math.PI * 0.82;
            p.rig.leftArmPivot.rotation.z = waveOsc + 0.22;
            p.rig.rightArmPivot.rotation.z = -waveOsc - 0.22;
            const hop = Math.abs(Math.sin(nowSec * 5.2 + p.phase)) * 0.28;
            p.rig.root.position.y = hop;
        }

        // Speech Bubble triggers automatically when approaching within 32m!
        if (dist < 32.0 && (nowSec - p.lastSpeechTime > 15.0)) {
            p.lastSpeechTime = nowSec;
            triggerNPCSpeech(p.name, p.role, p.reasonLine, p as unknown as SpeechTarget, false, true);
        }

        // Pickup / Hint Check (< 11.5m)
        if (dist < 11.5) {
            if (player.botType === 'RATCHET') {
                if (_carriedPatients.length < MAX_CARRIED_PATIENTS) {
                    boardPatient(p);
                } else if (nowSec - p.lastNonRatchetHintTime > 10.0) {
                    p.lastNonRatchetHintTime = nowSec;
                    showToast('AMBULANCE FULL (3/3)', 'Deliver your current patients to Griffin Rock General Hospital first!');
                }
            } else if (nowSec - p.lastNonRatchetHintTime > 12.0) {
                p.lastNonRatchetHintTime = nowSec;
                const ratchetUnlocked = Array.isArray(progression.discoveredAllies) && progression.discoveredAllies.includes('RATCHET');
                showToast(
                    `${p.name.toUpperCase()} NEEDS RATCHET!`,
                    ratchetUnlocked
                        ? 'Switch to Ratchet to pick up this patient for Griffin Rock Hospital!'
                        : 'Visit Griffin Rock General Hospital Ambulance Bay to unlock Ratchet!'
                );
            }
        }
    }

    // 3. Hospital Drop-Off Zone Check (Surface only, when playing as Ratchet with patients onboard!)
    if (isSurface && _carriedPatients.length > 0 && player.botType === 'RATCHET') {
        const distToDrop = Math.hypot(player.pos.x - HOSPITAL_DROPOFF_PAD.x, player.pos.z - HOSPITAL_DROPOFF_PAD.z);
        const distToBay = Math.hypot(player.pos.x - (HOSPITAL_POS.x - 16), player.pos.z - (HOSPITAL_POS.z + 2));
        if (distToDrop < 22.0 || distToBay < 16.0) {
            deliverCarriedPatientsToHospital();
        }
    }

    // 4. Celebration Citizen Timer at Hospital Entrance
    if (isSurface && _celebrationMesh && _celebrationTimer > 0) {
        _celebrationTimer -= dt;
        _celebrationMesh.rotation.y = Math.atan2(
            player.pos.x - _celebrationMesh.position.x,
            player.pos.z - _celebrationMesh.position.z
        );
        if (_celebrationTimer <= 0) {
            _celebrationMesh.visible = false;
        }
    }

    syncPatientTransportHUD();
}

export function getPatientsMapData() {
    return {
        surface: _surfacePatients
            .filter(p => p.state === 'WAITING')
            .map(p => ({ id: p.id, name: p.name, shortLabel: p.shortLabel, category: p.category, x: p.x, z: p.z })),
        underground: _undergroundPatients
            .filter(p => p.state === 'WAITING')
            .map(p => ({ id: p.id, name: p.name, shortLabel: p.shortLabel, category: p.category, x: p.x, z: p.z })),
        carriedCount: _carriedPatients.length,
        hospitalPos: HOSPITAL_POS,
        hospitalDropPos: HOSPITAL_DROPOFF_PAD
    };
}

export function getCarriedPatients(): CarriedPatientInfo[] {
    return _carriedPatients;
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        getPatientsMapData,
        getCarriedPatients,
        setWaypointToPatientDestination,
        triggerRatchetMedScannerPickup
    });
}

// Griffin Rock Interactive Commercial Recycling Dumpsters & Salvage Hopper Dump Mechanic
import * as THREE from 'three';
import { getSurfaceHeight } from './terrain.js';
import { toonGrad3, toonGrad4, matDarkSteel, matChrome, matInkOutline } from '../rendering/materials.js';
import { player, botRigs, worldColliders, registerCullableObject, worldState } from '../state/gameState.js';
import { sfx } from '../audio/soundFX.js';
import { showToast, triggerNPCSpeech } from '../ui/dialogs.js';
import { progression, saveProgression } from '../progression/progression.js';
import { spawnBurstParticles, spawnSparkleGlints } from './emergencies.js';
import { createDumpsterMesh } from './propModels.js';

export { createDumpsterMesh };

export interface DumpsterInstance {
    id: number;
    name: string;
    x: number;
    y: number;
    z: number;
    rotY: number;
    mesh: THREE.Group;
    bodyMesh: THREE.Mesh;
    lidGroup: THREE.Group;
    trashGroup: THREE.Group;
    collider: any;
    isBeingDumped: boolean;
    emptied: boolean;
    refillTimer: number;
    origPos: THREE.Vector3;
    origRotY: number;
}

export const activeDumpsters: DumpsterInstance[] = [];

// ---------------------------------------------------------------------
// Dumpster Locations across Griffin Rock
// ---------------------------------------------------------------------
export const DUMPSTER_LOCATIONS = [
    { name: "Griffin Diner Kitchen Alley", x: -84.0, z: 27.0, rotY: 0.15 },
    { name: "Rescue Bots HQ Service Yard", x: -36.0, z: -26.0, rotY: 1.25 },
    { name: "South Harbor Marina Docks", x: 48.0, z: 1152.0, rotY: -0.42 },
    { name: "Harbor Warehouse & Crane Pier", x: -142.0, z: 1138.0, rotY: 1.57 },
    { name: "West Tech Center Doc Greene Alley", x: -1138.0, z: -45.0, rotY: 0.72 },
    { name: "Testing Yard Proving Grounds Depot", x: -1275.0, z: -82.0, rotY: -1.18 },
    { name: "Sunny Sands Boardwalk Arcade", x: 768.0, z: -718.0, rotY: 0.52 },
    { name: "Dino Ridge Sanctuary Trailhead", x: 758.0, z: 715.0, rotY: -0.85 },
    { name: "Town Hall Municipal Service Bay", x: 38.0, z: 125.0, rotY: 1.57 },
    { name: "Central Railway Freight Depot", x: 742.0, z: -98.0, rotY: -0.25 },
    { name: "Wayward Causeway Coastal Turnout", x: 1425.0, z: 515.0, rotY: 0.95 },
    { name: "East Lighthouse Lookout Shed", x: 1175.0, z: -78.0, rotY: -1.35 }
];

export function initDumpsters(scene: THREE.Scene) {
    const s = scene || (typeof window !== 'undefined' ? (window as any).scene : null);
    if (!s) return;

    activeDumpsters.length = 0;

    DUMPSTER_LOCATIONS.forEach((loc, idx) => {
        const { root, bodyMesh, lidGroup, trashGroup } = createDumpsterMesh();
        const gy = getSurfaceHeight(loc.x, loc.z);
        root.position.set(loc.x, gy, loc.z);
        root.rotation.y = loc.rotY;

        s.add(root);
        registerCullableObject(root, loc.x, gy + 1, loc.z, 7.5);

        const dumpsterObj: DumpsterInstance = {
            id: idx,
            name: loc.name,
            x: loc.x,
            y: gy,
            z: loc.z,
            rotY: loc.rotY,
            mesh: root,
            bodyMesh,
            lidGroup,
            trashGroup,
            collider: null,
            isBeingDumped: false,
            emptied: false,
            refillTimer: 0,
            origPos: new THREE.Vector3(loc.x, gy, loc.z),
            origRotY: loc.rotY
        };

        // Solid physical obstacle: bots collide with dumpsters and cannot drive through them!
        const collider = {
            x: loc.x,
            z: loc.z,
            r: 1.85,
            type: 'DUMPSTER',
            target: dumpsterObj,
            destroyed: false
        };
        dumpsterObj.collider = collider;
        worldColliders.push(collider);

        activeDumpsters.push(dumpsterObj);
    });

    if (typeof window !== 'undefined') {
        (window as any).activeDumpsters = activeDumpsters;
        (window as any).getNearestDumpster = getNearestDumpster;
        (window as any).triggerDumpsterHopperDump = triggerDumpsterHopperDump;
    }
}

// ---------------------------------------------------------------------
// Salvage Dumpster Detection & Hopper Dump Interaction
// ---------------------------------------------------------------------

export function getNearestDumpster(playerRef: any, maxDist = 8.5): DumpsterInstance | null {
    if (!playerRef || !playerRef.pos) return null;
    let closest: DumpsterInstance | null = null;
    let closestDist = maxDist;

    for (let i = 0; i < activeDumpsters.length; i++) {
        const d = activeDumpsters[i];
        if (d.isBeingDumped) continue;
        const dist = Math.hypot(playerRef.pos.x - d.x, playerRef.pos.z - d.z);
        if (dist < closestDist) {
            closestDist = dist;
            closest = d;
        }
    }
    return closest;
}

export function isDumpsterNearPlayer(playerRef: any, threshold = 8.5): boolean {
    if (worldState.activeArea === 'UNDERGROUND') return false;
    return getNearestDumpster(playerRef, threshold) !== null;
}

export function triggerDumpsterHopperDump(playerRef: any): boolean {
    if (!playerRef || playerRef.botType !== 'SALVAGE') return false;
    if (playerRef.dumpsterTimer > 0) return false;

    const targetDumpster = getNearestDumpster(playerRef, 8.5);
    if (!targetDumpster || targetDumpster.isBeingDumped) return false;

    targetDumpster.isBeingDumped = true;
    playerRef.dumpsterTimer = 2.4; // 2.4-second full theatrical hopper dump
    playerRef.activeDumpster = targetDumpster;
    playerRef.speed = 0; // Lock vehicle during lifting

    // Sound: Hydraulic arm lift whirr & motor engage
    sfx.playTransform(false);

    showToast("GRIPPING DUMPSTER", "Salvage lifting dumpster into compactor hopper!");
    return true;
}

// ---------------------------------------------------------------------
// Animation Loop: Lift, Tip, Spill Recyclable Scrap & Lower Back Down
// ---------------------------------------------------------------------
export function updateDumpsters(dt: number, now: number) {
    // 1. Refill emptied dumpsters periodically (every 45s)
    for (let i = 0; i < activeDumpsters.length; i++) {
        const d = activeDumpsters[i];
        if (d.emptied && !d.isBeingDumped) {
            d.refillTimer += dt;
            if (d.refillTimer > 45.0) {
                d.emptied = false;
                d.refillTimer = 0;
                d.trashGroup.visible = true;
            }
        }
    }

    // 2. Active Salvage Dumpster Hopper Dump Sequence
    if (player.dumpsterTimer > 0 && player.activeDumpster) {
        player.dumpsterTimer = Math.max(0, player.dumpsterTimer - dt);
        player.speed = 0; // Hold vehicle stationary while lifting

        const d: DumpsterInstance = player.activeDumpster;
        const totalDuration = 2.4;
        const progress = 1.0 - (player.dumpsterTimer / totalDuration); // 0.0 to 1.0

        const salvageRig = botRigs.SALVAGE;
        const isVeh = player.mode === 'VEHICLE';

        // Orientation vectors for Salvage
        const sinH = Math.sin(player.heading);
        const cosH = Math.cos(player.heading);

        // Articulate Salvage loader arms if available
        if (salvageRig && salvageRig.salvageLoaderArms) {
            if (progress < 0.40) {
                // Arms raising forward & up
                const armPhase = progress / 0.40;
                salvageRig.salvageLoaderArms.rotation.x = -armPhase * Math.PI * 0.72;
            } else if (progress < 0.68) {
                // Arms tipped back over hopper
                salvageRig.salvageLoaderArms.rotation.x = -Math.PI * 0.72;
            } else {
                // Arms lowering back down
                const armPhase = (progress - 0.68) / 0.32;
                salvageRig.salvageLoaderArms.rotation.x = -(1.0 - armPhase) * Math.PI * 0.72;
            }
        }

        if (progress < 0.38) {
            // PHASE 1: LIFTING UP OVER CAB
            const p1 = progress / 0.38;
            const easeLift = Math.sin(p1 * Math.PI * 0.5);

            // Arc from ground up in front of Salvage
            const forwardOffset = THREE.MathUtils.lerp(3.6, 0.4, easeLift);
            const liftY = THREE.MathUtils.lerp(d.origPos.y, player.pos.y + 4.8, easeLift);

            d.mesh.position.set(
                player.pos.x + sinH * forwardOffset,
                liftY,
                player.pos.z + cosH * forwardOffset
            );
            d.mesh.rotation.y = player.heading;
            d.mesh.rotation.x = easeLift * 0.52; // initial tilt
            d.lidGroup.rotation.x = 0;

        } else if (progress < 0.68) {
            // PHASE 2: TIPPING OVER HOPPER & DUMPING TRASH
            const p2 = (progress - 0.38) / 0.30;
            const tipAngle = 0.52 + Math.sin(p2 * Math.PI) * 1.75; // tips up to ~135° upside down over hopper

            const hopperOffset = isVeh ? -0.8 : -0.2;
            const hopperY = player.pos.y + 4.6 + Math.sin(p2 * Math.PI * 2) * 0.15; // shake effect!

            d.mesh.position.set(
                player.pos.x + sinH * hopperOffset,
                hopperY,
                player.pos.z + cosH * hopperOffset
            );
            d.mesh.rotation.y = player.heading;
            d.mesh.rotation.x = tipAngle;

            // Lids swing wide open!
            d.lidGroup.rotation.x = -THREE.MathUtils.lerp(0, 1.6, Math.min(1.0, p2 * 2.5));

            // Cascading trash & scrap metal waterfall into hopper!
            if (Math.random() < 0.65) {
                const hopperDropX = player.pos.x - sinH * 0.6 + (Math.random() - 0.5) * 1.2;
                const hopperDropZ = player.pos.z - cosH * 0.6 + (Math.random() - 0.5) * 1.2;
                const dropY = player.pos.y + 3.2;

                spawnBurstParticles(hopperDropX, dropY, hopperDropZ, 0x84cc16, 4, 0.9);
                spawnBurstParticles(hopperDropX, dropY, hopperDropZ, 0xfacc15, 3, 0.8);
                spawnBurstParticles(hopperDropX, dropY, hopperDropZ, 0x38bdf8, 3, 0.8);
                spawnSparkleGlints(hopperDropX, dropY + 0.4, hopperDropZ, 4);

                if (Math.random() < 0.3) {
                    sfx.playRockBreak();
                }
            }

            d.trashGroup.visible = false;

        } else {
            // PHASE 3: LOWERING DUMPSTER BACK TO GROUND
            const p3 = (progress - 0.68) / 0.32;
            const easeLower = Math.cos(p3 * Math.PI * 0.5);

            const forwardOffset = THREE.MathUtils.lerp(3.6, 0.4, easeLower);
            const lowerY = THREE.MathUtils.lerp(d.origPos.y, player.pos.y + 4.8, easeLower);

            d.mesh.position.set(
                player.pos.x + sinH * forwardOffset,
                lowerY,
                player.pos.z + cosH * forwardOffset
            );
            d.mesh.rotation.y = THREE.MathUtils.lerp(d.origRotY, player.heading, easeLower);
            d.mesh.rotation.x = easeLower * 0.52;

            // Lids snap shut on return
            d.lidGroup.rotation.x = THREE.MathUtils.lerp(0, -1.6, easeLower);
        }

        // SEQUENCE FINISHED: DUMPSTER RESTORED & AWARDS GIVEN!
        if (progress >= 1.0) {
            d.mesh.position.copy(d.origPos);
            d.mesh.rotation.set(0, d.origRotY, 0);
            d.lidGroup.rotation.x = 0;
            d.isBeingDumped = false;
            d.emptied = true;
            d.refillTimer = 0;

            if (salvageRig && salvageRig.salvageLoaderArms) {
                salvageRig.salvageLoaderArms.rotation.x = 0;
            }

            player.dumpsterTimer = 0;
            player.activeDumpster = null;

            // Clanking lid sound
            sfx.playDockClank();
            sfx.playRankUp();

            // Awards
            progression.heroPoints = (progression.heroPoints || 0) + 25;
            progression.energonCollected = (progression.energonCollected || 0) + 15;
            saveProgression();

            spawnBurstParticles(player.pos.x, player.pos.y + 2.5, player.pos.z, 0x84cc16, 26, 1.8);
            spawnBurstParticles(player.pos.x, player.pos.y + 2.5, player.pos.z, 0xfacc15, 18, 1.6);
            spawnSparkleGlints(player.pos.x, player.pos.y + 2.0, player.pos.z, 20);

            showToast(
                "HOPPER COMPACTOR DUMP",
                "+25 Hero Pts • +15 Energon • Dumpster Emptied into Salvage's Hopper!"
            );

            triggerNPCSpeech(
                "SALVAGE",
                "Recycling Hero",
                "Clean, green, recycling machine! That dumpster is sorted and compacted!",
                player,
                false
            );
        }
    }
}

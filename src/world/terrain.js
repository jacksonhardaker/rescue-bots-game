// Griffin Rock Island Terrain & Biome Elevation Math
import * as THREE from "three";

// 10X Larger Living World: 4950x4950 units (~24.5M sq units -> 10x the previous 1560x1560 area!)
        export const WORLD_SIZE = 4950;
        export const INNER_LOOP_RADIUS = 380;
        export const OUTER_LOOP_RADIUS = 1120;
        export const COAST_BASE_RADIUS = 1650;

        export function getInnerRoadRadius(theta) {
            return INNER_LOOP_RADIUS + Math.sin(theta * 2) * 32 + Math.cos(theta * 3) * 20;
        }

        export function getOuterRoadRadius(theta) {
            return OUTER_LOOP_RADIUS + Math.sin(theta * 2) * 85 + Math.cos(theta * 3) * 55;
        }

        export const RAILWAY_LOOP_RADIUS = 720;
        export function getRailwayRadius(theta) {
            return RAILWAY_LOOP_RADIUS + Math.sin(theta * 3) * 55 + Math.cos(theta * 2) * 45;
        }

        export function getRoadLoopRadius(theta) {
            return getInnerRoadRadius(theta);
        }

        export function getCoastLimitRadius(theta) {
            return COAST_BASE_RADIUS + Math.sin(theta * 4) * 95 + Math.cos(theta * 3) * 75;
        }

        export function getTerrainHeight(x, z) {
            // 0. Wayward Island (Mysterious Offshore Jungle & Ruins Island at X: 1960, Z: 540)
            const distWayward = Math.hypot(x - 1960, z - 540);
            if (distWayward < 340) {
                const wNorm = (340 - distWayward) / 340;
                let wh = Math.pow(wNorm, 1.35) * 28.0;
                wh += Math.sin(x * 0.02 + z * 0.02) * 2.8;
                if (distWayward > 270) {
                    const beachT = (distWayward - 270) / 70;
                    wh = THREE.MathUtils.lerp(wh, -9.5, beachT);
                }
                // Flatten central temple & ruins plateau around (1960, 540)
                if (distWayward < 120) {
                    const flatT = Math.max(0, Math.min(1, (distWayward - 65) / 55));
                    wh = wh * flatT + 18.5 * (1 - flatT);
                }
                // Smooth road ascent from Causeway Bridge landing (x: 1730, z: 540) up to ruins plateau (x: 1960)
                if (x >= 1730 && x <= 1960 && Math.abs(z - 540) < 22) {
                    const roadT = (x - 1730) / (1960 - 1730);
                    const roadH = 7.5 + roadT * 11.0; // rises gently from 7.5m to 18.5m
                    const latBlend = Math.max(0, Math.min(1, Math.abs(z - 540) / 22));
                    wh = THREE.MathUtils.lerp(roadH, wh, latBlend);
                }
                return wh;
            }

            const r = Math.sqrt(x * x + z * z);
            const theta = Math.atan2(z, x);

            const coastLimit = getCoastLimitRadius(theta);
            if (r > coastLimit + 120) return -9.5;

            // Rolling island topography across the 10x island expanse
            let h = 4.5 + Math.sin(x * 0.0045) * Math.cos(z * 0.0045) * 12.0;
            h += Math.sin(x * 0.014 + z * 0.012) * 3.2;

            // 1. North-West Volcano & Quarry Peak (-820, -840)
            const distVolcano = Math.hypot(x + 820, z + 840);
            if (distVolcano < 460) {
                const vNorm = (460 - distVolcano) / 460;
                h += Math.pow(vNorm, 1.55) * 96;
                if (distVolcano < 68) {
                    h -= (68 - distVolcano) * 0.45;
                }
            }

            // 2. North-East Communications Array Mountain (780, -780)
            const distCommPeak = Math.hypot(x - 780, z + 780);
            if (distCommPeak < 420) {
                const cNorm = (420 - distCommPeak) / 420;
                h += Math.pow(cNorm, 1.45) * 72;
                if (distCommPeak < 52) {
                    h = 68;
                }
            }

            // 3. East Lighthouse Peninsula Cliff (1320, 60) - elevated ocean bluff safely east of Outer Ring Highway
            const distCliff = Math.hypot(x - 1320, z - 60);
            if (distCliff < 240) {
                h += Math.pow((240 - distCliff) / 240, 1.4) * 32;
            }
            // Flatten East Lighthouse Lookout Terrace (around 1320, 60)
            if (distCliff < 85) {
                const flatFactor = Math.max(0, Math.min(1, (distCliff - 45) / 40));
                h = h * flatFactor + 14.5 * (1 - flatFactor);
            }

            // 4. Flatten Rescue Bots HQ & Griffin Town Central Plaza (around 0, 0)
            const distTown = Math.hypot(x, z);
            if (distTown < 210) {
                const flatFactor = Math.max(0, Math.min(1, (distTown - 145) / 65));
                h = h * flatFactor + 4.5 * (1 - flatFactor);
            }

            // 5. Flatten South Harbor Cargo Port (around 0, 1140)
            const distHarbor = Math.hypot(x, z - 1140);
            if (distHarbor < 210) {
                const flatFactor = Math.max(0, Math.min(1, (distHarbor - 135) / 75));
                h = h * flatFactor + 3.0 * (1 - flatFactor);
            }

            // 5B. South Harbor Bay Inlet (carving deep blue ocean bay water from quay at z=1184 out to sea)
            if (z >= 1184) {
                const bayHalfWidth = 130.0 + (z - 1184) * 0.48;
                const ax = Math.abs(x);
                if (ax < bayHalfWidth + 50.0) {
                    const bayZBlend = Math.min(1.0, Math.max(0.0, (z - 1184.0) / 14.0));
                    const bayXBlend = Math.min(1.0, Math.max(0.0, (ax - (bayHalfWidth - 30.0)) / 80.0));
                    const seabedDepth = -6.8;
                    const targetH = h * (1.0 - bayZBlend) + seabedDepth * bayZBlend;
                    h = targetH * (1.0 - bayXBlend) + h * bayXBlend;
                }
            }

            // 6. Flatten West Tech Village & Doc Greene's Testing Yard (around -1120, 25 and -1250, 65)
            const distTestingYard = Math.hypot(x + 1250, z - 65);
            if (distTestingYard < 110) {
                const flatFactor = Math.max(0, Math.min(1, (distTestingYard - 68) / 42));
                h = h * flatFactor + 5.2 * (1 - flatFactor);
            }
            const distWestHub = Math.hypot(x + 1120, z - 25);
            if (distWestHub < 185) {
                const flatFactor = Math.max(0, Math.min(1, (distWestHub - 115) / 70));
                h = h * flatFactor + 5.2 * (1 - flatFactor);
            }

            // 7. Flatten North Observatory Outpost (around 0, -1120)
            const distNorthHub = Math.hypot(x, z + 1120);
            if (distNorthHub < 175) {
                const flatFactor = Math.max(0, Math.min(1, (distNorthHub - 105) / 70));
                h = h * flatFactor + 6.0 * (1 - flatFactor);
            }

            // 8. Flatten Dino Ridge & Mount Magma Sanctuary (around -750, -750)
            const distDinoRidge = Math.hypot(x + 750, z + 750);
            if (distDinoRidge < 175) {
                const flatFactor = Math.max(0, Math.min(1, (distDinoRidge - 105) / 70));
                h = h * flatFactor + 9.5 * (1 - flatFactor);
            }

            // 9. Flatten Sunny Sands Boardwalk & Pier (around -750, 750)
            const distSunnySands = Math.hypot(x + 750, z - 750);
            if (distSunnySands < 175) {
                const flatFactor = Math.max(0, Math.min(1, (distSunnySands - 105) / 70));
                h = h * flatFactor + 3.2 * (1 - flatFactor);
            }

            // 10. Flatten Dr. Morocco's Secret Cliffside Lair Plateau (around -820, -1180)
            const distMorocco = Math.hypot(x + 820, z + 1180);
            if (distMorocco < 155) {
                const flatFactor = Math.max(0, Math.min(1, (distMorocco - 85) / 70));
                h = h * flatFactor + 11.5 * (1 - flatFactor);
            }

            // Carve Inner & Outer Ring Highways + North-South & East-West Arterials + Connecting Spurs
            const innerR = getInnerRoadRadius(theta);
            const outerR = getOuterRoadRadius(theta);
            const distInner = Math.abs(r - innerR);
            const distOuter = Math.abs(r - outerR);
            const distNS = (z > -1180 && z < 1185) ? Math.abs(x) : 999;
            const distEW = (x > -1180 && x < 1210) ? Math.abs(z - 25) : 999;
            const distCausewayApproach = (x >= 1065 && x <= 1520) ? Math.abs(z - 540) : 999;
            const distLighthouseRoad = (x >= 1175 && x <= 1325) ? Math.abs(z - 60) : 999;

            // Morocco Lair Access Road segment: connects Outer Ring at (-619.3, -1083.8) to Lair at (-820, -1180)
            const mLenSq = 200.7 * 200.7 + 96.2 * 96.2;
            const mRoadT = Math.max(0, Math.min(1, ((x - (-619.3)) * (-200.7) + (z - (-1083.8)) * (-96.2)) / mLenSq));
            const mProjX = -619.3 + mRoadT * (-200.7);
            const mProjZ = -1083.8 + mRoadT * (-96.2);
            const distMoroccoRoad = Math.hypot(x - mProjX, z - mProjZ);

            const minRoadDist = Math.min(distInner, distOuter, distNS, distEW, distCausewayApproach, distLighthouseRoad, distMoroccoRoad);

            if (minRoadDist < 26) {
                // Smooth wide shoulder embankment with gentle cosine transition
                const roadBlend = Math.max(0, Math.min(1, (minRoadDist - 12.0) / 14.0));
                const smoothBlend = roadBlend * roadBlend * (3 - 2 * roadBlend);
                let idealRoadH = Math.max(3.4, h * 0.38 + 2.2);

                if (distCausewayApproach < 22 && x >= 1075) {
                    const cT = Math.max(0, Math.min(1, (x - 1075) / 120));
                    idealRoadH = THREE.MathUtils.lerp(idealRoadH, 7.5, cT);
                } else if (distLighthouseRoad < 22 && x >= 1180) {
                    const lT = Math.max(0, Math.min(1, (x - 1180) / 140));
                    const smoothLT = lT * lT * (3 - 2 * lT);
                    idealRoadH = THREE.MathUtils.lerp(idealRoadH, 14.5, smoothLT);
                } else if (distMoroccoRoad < 26) {
                    idealRoadH = THREE.MathUtils.lerp(9.3, 11.5, mRoadT);
                }
                h = h * smoothBlend + idealRoadH * (1 - smoothBlend);
            }

            // Griffin Rock Island Railway Embankment Corridor (Smooth, solid roadbed along mid-ring railway circuit)
            const rRail = getRailwayRadius(theta);
            const distRail = Math.abs(r - rRail);
            if (distRail < 48) {
                const railBlend = Math.max(0, Math.min(1, (distRail - 22.0) / 26.0));
                const smoothRailBlend = railBlend * railBlend * (3 - 2 * railBlend);
                const idealRailH = Math.max(3.8, h * 0.25 + 2.2);
                h = h * smoothRailBlend + idealRailH * (1 - smoothRailBlend);
            }

            // Smooth sandy beach slope into ocean
            if (r > coastLimit - 85) {
                const t = (r - (coastLimit - 85)) / 185;
                const clampedT = Math.max(0, Math.min(1, t));
                const smoothT = clampedT * clampedT * (3 - 2 * clampedT);
                h = h * (1 - smoothT) + (-9.5) * smoothT;
            }

            return h;
        }

        const ramps = [];
        let ferryController = null;

        export function getSurfaceHeight(x, z) {
            // Wayward Island Suspension Causeway Bridge (X: 1480 .. 1760, Z: 540)
            if (x >= 1480 && x <= 1760 && Math.abs(z - 540) <= 10.5) {
                if (x <= 1735) return 7.5;
                const blendT = (x - 1735) / 25;
                return THREE.MathUtils.lerp(7.5, getTerrainHeight(x, z), blendT);
            }
            // South Harbor Pier Dock Deck
            if (Math.abs(x) <= 16.5 && z >= 1180 && z <= 1278) {
                return 3.4;
            }
            // High Tide Offshore Marine Training Rig in South Harbor Bay (X: -60, Z: 1480)
            if (Math.abs(x - (-60)) <= 13.0 && Math.abs(z - 1480) <= 13.0) {
                return 1.0;
            }
            // South Harbor Ferry Boarding Bridge Ramp & Pedestrian Side Gangway
            if (x >= 14.5 && x <= 38.0 && z >= 1202.0 && z <= 1220.0) {
                const t = Math.max(0, Math.min(1, (x - 15.0) / 21.0));
                return THREE.MathUtils.lerp(3.4, 4.8, t);
            }
            if (x >= 15.0 && x <= 32.0 && z >= 1226.0 && z <= 1238.0) {
                const t = Math.max(0, Math.min(1, (x - 15.0) / 15.0));
                return THREE.MathUtils.lerp(3.4, 4.8, t);
            }
            // Wayward Island Scenic Pier Deck over ocean channel
            const wPierAlong = (x - 1802) * -0.559 + (z - 306) * -0.829;
            const wPierAcross = (x - 1802) * 0.829 + (z - 306) * -0.559;
            if (wPierAlong >= -32 && wPierAlong <= 35 && Math.abs(wPierAcross) <= (wPierAlong > 21 ? 18.0 : 9.0)) {
                if (wPierAlong <= -22) {
                    const blend = (wPierAlong - (-32)) / 10;
                    return THREE.MathUtils.lerp(getTerrainHeight(x, z), 2.2, blend);
                }
                return 2.2;
            }
            // Docked or Sailing Ferry Boat Deck (rotates precisely with boat heading)
            if (ferryController && ferryController.currentPos) {
                const fdx = x - ferryController.currentPos.x;
                const fdz = z - ferryController.currentPos.z;
                const cosR = Math.cos(-ferryController.currentRotY);
                const sinR = Math.sin(-ferryController.currentRotY);
                const lx = fdx * cosR - fdz * sinR;
                const lz = fdx * sinR + fdz * cosR;
                if (Math.abs(lx) <= 7.8 && Math.abs(lz) <= 20.5) {
                    return ferryController.currentPos.y + 5.0;
                }
                // Stern Boarding Ramp (unfolded when docked)
                if (ferryController.state === 'DOCKED' && Math.abs(lx) <= 5.8 && lz >= -25.5 && lz < -18.0) {
                    const rampT = (lz - (-25.5)) / 7.5;
                    return ferryController.currentPos.y + THREE.MathUtils.lerp(3.8, 5.0, rampT);
                }
            } else if (Math.abs(x - 36) <= 7.8 && z >= 1210 && z <= 1254) {
                return 5.0;
            }
            // Doc Greene's Anti-Gravity Testing Yard Platform Deck (X: -1250, Z: 65)
            if (Math.abs(x - (-1250)) <= 43.0 && Math.abs(z - 65) <= 30.0) {
                const tyBase = getTerrainHeight(-1250, 65);
                // On the Supersonic Speed Strip Deck (Z: 80.5 to 87.5, X: -1290 to -1210)
                if (Math.abs(x - (-1250)) <= 40.0 && Math.abs(z - 84) <= 3.8) {
                    return tyBase + 0.72;
                }
                // On the Super Mega-Bounce Pad Membrane (radius 5.8 around -1250, 58)
                const distBounce = Math.hypot(x - (-1250), z - 58);
                if (distBounce <= 5.8) {
                    return tyBase + 1.15;
                }
                // General Testing Yard Plinth Deck
                return tyBase + 0.5;
            }
            // Stunt Ramp Surfaces (allows vehicles & bots to smoothly drive and run up the ramp incline)
            for (let i = 0; i < ramps.length; i++) {
                const rm = ramps[i];
                const dx = x - rm.x;
                const dz = z - rm.z;
                if (Math.abs(dx) < rm.r && Math.abs(dz) < rm.r) {
                    const lx = dx * rm.cosY - dz * rm.sinY;
                    const lz = dx * rm.sinY + dz * rm.cosY;
                    const hw = rm.w * 0.5;
                    const hl = rm.l * 0.5;
                    if (Math.abs(lx) <= hw + 0.1 && lz >= -hl - 0.1 && lz <= hl + 0.1) {
                        const t = Math.max(0, Math.min(1, (lz + hl) / rm.l));
                        const baseGround = getTerrainHeight(x, z);
                        return baseGround + t * rm.height;
                    }
                }
            }
            return getTerrainHeight(x, z);
        }

        export function isPointOnRoad(x, z) {
            const r = Math.sqrt(x * x + z * z);
            const theta = Math.atan2(z, x);
            if (Math.abs(r - getInnerRoadRadius(theta)) < 12.5) return true;
            if (Math.abs(r - getOuterRoadRadius(theta)) < 13.5) return true;
            // Griffin Rock Island Railway Circuit Corridor (Tracks & Ballast Bed)
            if (Math.abs(r - getRailwayRadius(theta)) < 6.8) return true;
            // Grand North-South Highway from North Outpost (0, -1160) to South Harbor (0, 1180)
            if (Math.abs(x) < 12.0 && z > -1160 && z < 1180) return true;
            // Grand East-West Highway from West Tech Park (-1160, 25) to East Coast Highway (1205, 25)
            if (Math.abs(z - 25) < 12.0 && x > -1160 && x < 1205) return true;
            // Scenic East Lighthouse Access Road (X: 1175 .. 1320, Z: 60)
            if (Math.abs(z - 60) < 12.0 && x >= 1175 && x <= 1320) return true;
            // Wayward Causeway Highway, Suspension Bridge and Island Road (X: 1065 .. 1960, Z: 540)
            if (Math.abs(z - 540) < 12.5 && x >= 1065 && x <= 1960) return true;
            // Wayward Island Coastal Trail Loop
            const dWaywardCenter = Math.hypot(x - 1960, z - 540);
            if (dWaywardCenter >= 175 && dWaywardCenter <= 245) return true;
            // Wayward Island Scenic Pier Deck over ocean channel
            const pierAlong = (x - 1802) * -0.559 + (z - 306) * -0.829;
            const pierAcross = (x - 1802) * 0.829 + (z - 306) * -0.559;
            if (pierAlong >= -32 && pierAlong <= 35 && Math.abs(pierAcross) <= (pierAlong > 21 ? 18.0 : 9.0)) return true;
            // South Harbor Pier Deck, Boarding Bridge, and Ferry Deck
            if (Math.abs(x) <= 16.5 && z >= 1180 && z <= 1278) return true;
            if (x >= 14.0 && x <= 38.0 && z >= 1202.0 && z <= 1220.0) return true;
            if (x >= 15.0 && x <= 32.0 && z >= 1226.0 && z <= 1238.0) return true;
            if (Math.abs(x - (-60)) <= 13.0 && Math.abs(z - 1480) <= 13.0) return true;
            if (Math.abs(x - 762) <= 9.2 && Math.abs(z - (-780)) <= 9.2) return true;
            if (ferryController && ferryController.currentPos) {
                const fdx = x - ferryController.currentPos.x;
                const fdz = z - ferryController.currentPos.z;
                if (Math.hypot(fdx, fdz) <= 22.0) return true;
            }
            // Dr. Morocco Airship Lair Access Road & Plaza (connects Outer Ring at -619.3, -1083.8 to -820, -1180)
            const mLenSq = 200.7 * 200.7 + 96.2 * 96.2;
            const mRoadT = Math.max(0, Math.min(1, ((x - (-619.3)) * (-200.7) + (z - (-1083.8)) * (-96.2)) / mLenSq));
            if (Math.hypot(x - (-619.3 + mRoadT * (-200.7)), z - (-1083.8 + mRoadT * (-96.2))) < 12.0) return true;
            if (Math.hypot(x + 820, z + 1180) < 55) return true;
            // Clear trees from Griffin Rock Railway Corridor & Central Station Platform
            const rTree = Math.hypot(x, z);
            const thetaTree = Math.atan2(z, x);
            if (Math.abs(rTree - getRailwayRadius(thetaTree)) < 14.0) return true;
            if (Math.hypot(x - 765, z - 75) < 35) return true; // Central Station Depot
            // Dedicated GroundBridge turnout staging bays
            if (Math.hypot(x - (-1085), z - 62) < 24) return true;
            if (Math.hypot(x - 48, z - 1040) < 24) return true;
            if (Math.hypot(x - (-750), z - (-665)) < 24) return true;
            if (Math.hypot(x - 1895, z - 492) < 24) return true;

            // Clear all Paved Intersection Aprons & Traffic Circles from trees and rocks
            if (Math.hypot(x, z - 25) < 24.0) return true; // Central Griffin Plaza (NS x EW)
            if (Math.hypot(x - (-48), z - (-15)) < 24.0) return true; // Rescue Bots HQ Forecourt Apron
            if (Math.hypot(x, z - (-1120)) < 22.0) return true; // North Outer Junction
            if (Math.hypot(x, z - 1120) < 22.0) return true; // South Outer Junction
            if (Math.hypot(x, z - (-380)) < 22.0) return true; // North Inner Junction
            if (Math.hypot(x, z - 380) < 22.0) return true; // South Inner Junction
            if (Math.hypot(x - (-1060.8), z - 25) < 22.0) return true; // West Outer Junction
            if (Math.hypot(x - 1178.2, z - 25) < 22.0) return true; // East Outer Junction
            if (Math.hypot(x - (-355.1), z - 25) < 22.0) return true; // West Inner Junction
            if (Math.hypot(x - 402.8, z - 25) < 22.0) return true; // East Inner Junction
            if (Math.hypot(x - 1068.9, z - 540) < 22.0) return true; // Causeway Junction
            if (Math.hypot(x - 1181.5, z - 60) < 20.0) return true; // Lighthouse Junction

            return false;
        }

        export function isPointInWater(x, z) {
            const sh = getSurfaceHeight(x, z);
            const th = getTerrainHeight(x, z);
            // Water plane is at y = -0.45.
            // If surface is underwater (sh <= -0.35) or terrain is underwater and surface isn't an elevated deck/bridge
            return (sh <= -0.35 || (th <= -0.8 && sh < 0.25));
        }

        export function isNearWater(x, z, radius = 22.0) {
            if (isPointInWater(x, z)) return true;
            const curH = getSurfaceHeight(x, z);
            // If on a high suspension bridge (Wayward bridge surface ~7.5), don't allow diving unless near the shoreline/harbor piers
            if (curH > 4.5) return false;
            const steps = 12;
            const radSteps = 5;
            for (let r = 4.0; r <= radius; r += (radius - 4.0) / (radSteps - 1)) {
                for (let i = 0; i < steps; i++) {
                    const ang = (i / steps) * Math.PI * 2;
                    const sx = x + Math.cos(ang) * r;
                    const sz = z + Math.sin(ang) * r;
                    if (isPointInWater(sx, sz)) {
                        return true;
                    }
                }
            }
            return false;
        }

        export function getZoneName(x, z) {
            if (Math.hypot(x - (-820), z - (-1180)) < 65) return "DR. MOROCCO'S CLIFFSIDE LAIR";
            if (Math.hypot(x - (-60), z - 1480) < 48) return "HIGH TIDE OCEAN RIG";
            if (Math.hypot(x - 2020, z - 510) < 55) return "CYBERTRONIAN ANCIENT RUINS";
            if (Math.hypot(x - 762, z - (-780)) < 55) return "SKY ARRAY SUMMIT LOOKOUT";
            if (Math.hypot(x - (-54), z - 1140) < 45) return "HARBOR RECLAMATION BERTH";
            if (Math.hypot(x - 1802, z - 306) < 45) return "WAYWARD SCENIC PIER";
            if (ferryController && ferryController.currentPos && Math.hypot(x - ferryController.currentPos.x, z - ferryController.currentPos.z) < 32) return "SOUTH HARBOR FERRY";
            if (Math.hypot(x - 1960, z - 540) < 320) return "WAYWARD ISLAND";
            if (x >= 1480 && x <= 1760 && Math.abs(z - 540) <= 12) return "WAYWARD CAUSEWAY BRIDGE";
            if (Math.hypot(x + 750, z + 750) < 185) return "DINO RIDGE SANCTUARY";
            if (Math.hypot(x - (-825), z - 825) < 185) return "SUNNY SANDS BOARDWALK";
            if (Math.hypot(x + 110, z - 1150) < 35) return "HARBOR CRANE YARD";
            if (Math.hypot(x + 1250, z - 65) < 55) return "DOC GREENE'S TESTING YARD";
            if (Math.hypot(x - 36, z - (-45)) < 24) return "HQ LAUNCH CATAPULT";
            if (Math.hypot(x - (-92), z - (-15)) < 26) return "FIREHOUSE ROBO-WASH";
            if (Math.hypot(x - 78, z + 15) < 26) return "GRIFFIN ROCK DINER";
            if (Math.hypot(x - (-1110), z - (-42)) < 32) return "ENERGON TURBO-CHARGER";
            if (Math.hypot(x - (-1085), z - 62) < 28) return "WEST GROUNDBRIDGE";
            if (Math.hypot(x - 48, z - 1040) < 28) return "SOUTH GROUNDBRIDGE";
            if (Math.hypot(x - (-750), z - (-665)) < 28) return "DINO RIDGE GROUNDBRIDGE";
            if (Math.hypot(x - 1895, z - 492) < 28) return "WAYWARD RUINS GROUNDBRIDGE";
            if (Math.hypot(x - (-48), z - (-45)) < 55) return "RESCUE BOTS HQ";
            if (Math.hypot(x, z - 25) < 195) return "GRIFFIN TOWN CENTER";
            if (Math.hypot(x, z - 1140) < 220) return "SOUTH HARBOR PORT";
            if (Math.hypot(x + 1120, z - 25) < 190) return "WEST TECH VILLAGE";
            if (Math.hypot(x, z + 1120) < 190) return "NORTH OBSERVATORY";
            if (Math.hypot(x - 1320, z - 60) < 180) return "LIGHTHOUSE PENINSULA";
            if (Math.hypot(x + 820, z + 840) < 380) return "VOLCANO QUARRY";
            if (Math.hypot(x - 780, z + 780) < 350) return "SKY ARRAY PEAK";
            return "GRIFFIN ISLAND HIGHWAY";
        }

if (typeof window !== 'undefined') {
    Object.assign(window, {
        WORLD_SIZE,
        INNER_LOOP_RADIUS,
        OUTER_LOOP_RADIUS,
        COAST_BASE_RADIUS,
        RAILWAY_LOOP_RADIUS,
        getTerrainHeight,
        getSurfaceHeight,
        getInnerRoadRadius,
        getOuterRoadRadius,
        getRailwayRadius,
        isPointInWater,
        isNearWater,
        isPointOnRoad,
        getZoneName
    });
}

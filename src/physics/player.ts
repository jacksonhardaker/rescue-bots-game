// Active Player Controller, Bot Switching, Morph Animations & Action Triggers
import * as THREE from 'three';
import { player, buddyBot, botRigs, botPhraseCounters } from '../state/gameState.js';
import { BOT_METADATA, HQ_PARKING_SLOTS } from '../bots/botMeta.js';
import { applyBotRigMorph, getBotScale, setHighTideRigMega, setOptimusRigMega } from '../bots/botRigs.js';
import { sfx } from '../audio/soundFX.js';
import { triggerNPCSpeech, showToast } from '../ui/dialogs.js';
import { progression, saveProgression } from '../progression/progression.js';
import { syncVisitingAutobotsVisibility } from '../world/allies.js';
export { syncVisitingAutobotsVisibility };
import { spawnWaterCannonStream, spawnBurstParticles } from '../world/emergencies.js';
import { SVG_ICONS } from '../ui/icons.js';

import { waypointGroup } from './movement.js';
import { visitingAutobots } from '../world/allies.js';
import { beacons } from '../world/emergencies.js';
import { isNearWater, isPointInWater } from '../world/terrain.js';
import { spawnEnergonLightningParticles, spawnSparkleGlints } from '../world/emergencies.js';
import { highTideWorldShip, optimusWorldTrailer } from '../world/allies.js';
import { morbotBattle } from '../world/morbot.js';
        export const BOT_CATCHPHRASES = {
            BOULDER: {
                DEPLOY: [
                    "Boulder ready to roll! No rockslide is too big for us!",
                    "Boulder here! Dozer blade and hydraulics at full power!"
                ],
                TO_VEHICLE: [
                    "Boulder, transform! Bulldozer mode, clearing the way!",
                    "Rescue Bots, roll to the rescue! Dozer blade down!"
                ],
                TO_DINO: [
                    "Boulder, Dinobot mode! Triceratops charge!",
                    "Transforming to Triceratops! Watch the horns!"
                ],
                TO_BOT: [
                    "Boulder, transform! Robot mode, ready for heavy lifting!",
                    "Back to robot mode! What a fascination!"
                ],
                RESCUE: [
                    "Obstacles cleared! Griffin Rock is safe and sound!",
                    "Another emergency scooped clean! Great work, Rescue Bots!"
                ],
                WASH: [
                    "Boulder is squeaky clean and rock solid!",
                    "Dozer blade all washed down and ready to roll!"
                ],
                STUNT: [
                    "Boulder airborne! Who says bulldozers can't fly?",
                    "Heavy metal high jump! Rock on!"
                ],
                WEATHER_SUNNY: [
                    "What a beautiful sunny day on Griffin Rock! Boulder is ready to roll!",
                    "Clear skies and bright sun! Perfect day for Rescue Bots!"
                ],
                WEATHER_RAIN: [
                    "Rain on the rocks! Bulldozer treads have all the grip we need!",
                    "A little mud never stopped a bulldozer!"
                ],
                WEATHER_VOLCANO: [
                    "The mountain is grumbling! Boulder is ready for heavy rock clearing!",
                    "Volcano heat rising! Keep your hard hats on, team!"
                ],
                WEATHER_NIGHT: [
                    "Night Ops! Starry skies make for a peaceful patrol.",
                    "Headlights on! Boulder rolling through the night!"
                ],
                CATAPULT: [
                    "Rock and roll! Boulder launching to the rescue!",
                    "Bulldozer in flight! Here we go!"
                ],
                DINER: [
                    "Veggie burger with extra crunch! Delicious!",
                    "Fuel stop complete! Back on patrol!"
                ],
                CHARGER: [
                    "Energon overdrive! Boulder is charged and rock solid!",
                    "Maximum power! Feel that ground shake!"
                ],
                GROUNDBRIDGE: [
                    "Whoa! Instant transit across Griffin Rock! Incredible!",
                    "Doc Greene's inventions never cease to amaze me!"
                ],
                FERRY: [
                    "Smooth sailing! Boulder loves the ocean breeze!",
                    "Full steam ahead, Captain Shaw!"
                ],
                CRANE: [
                    "Whoa! Heavy lifting is usually my job! That was awesome!",
                    "Up, up, and dropped right into action!"
                ],
                BOUNCE: [
                    "BOING! Who knew a bulldozer could bounce so high?",
                    "Doc Greene's trampoline rocks! Literally!"
                ]
            },
            HEATWAVE: {
                DEPLOY: [
                    "Heatwave reporting for duty! Rescue Bots, roll to the rescue!",
                    "Heatwave here! Point me at the flames!"
                ],
                TO_VEHICLE: [
                    "Heatwave, transform and hose 'em down!",
                    "Fire engine mode! Rescue Bots, roll to the rescue!"
                ],
                TO_DINO: [
                    "Heatwave, Dinobot mode! Brachiosaurus stomp!",
                    "Transforming to Brachiosaurus! Let's make a splash!"
                ],
                TO_BOT: [
                    "Heatwave, transform! Back to robot mode!",
                    "Robot mode engaged! Ready for fire rescue!"
                ],
                RESCUE: [
                    "Fire out, citizens safe! That's how Rescue Bots roll!",
                    "Emergency cleared! Another job well done, team!"
                ],
                WASH: [
                    "Washed down and fired up! Ready for rescue!",
                    "Heatwave sparkling clean and rolling out!"
                ],
                STUNT: [
                    "Blazing through the sky! Yeah!",
                    "Hot wheels in the air! Stunt cleared!"
                ],
                WEATHER_SUNNY: [
                    "Clear skies and bright sunshine! Rescue Bots, roll to the rescue!",
                    "Sunshine all over the island! Heatwave ready for action!"
                ],
                WEATHER_RAIN: [
                    "Summer storm! Fire engine wipers on, team!",
                    "Rain or shine, nothing stops the Rescue Bots!"
                ],
                WEATHER_VOLCANO: [
                    "Volcano heat active! Water Cannon at the ready!",
                    "High thermal alert! We'll cool this caldera down!"
                ],
                WEATHER_NIGHT: [
                    "Night Ops engaged! Headlights bright, let's keep Griffin Rock safe!",
                    "Emergency beacons active! Patrolling the night!"
                ],
                CATAPULT: [
                    "Blast off! Heatwave rolling to the fire!",
                    "Full throttle launch! Stand clear!"
                ],
                DINER: [
                    "High-octane fuel shake! Ready to roll!",
                    "Energon burger to go! Rescue Bots, roll to the rescue!"
                ],
                CHARGER: [
                    "Engine blazing at top capacity! Rescue Bots, roll to the rescue!",
                    "Full turbo power! Nothing can stop us now!"
                ],
                GROUNDBRIDGE: [
                    "GroundBridge traversal complete! Responding anywhere in seconds!",
                    "Rapid response teleporter! That saves travel time!"
                ],
                FERRY: [
                    "Rescue Ferry on patrol! Harbor waters are all clear!",
                    "Fire engine on deck! Ready for sea rescue!"
                ],
                CRANE: [
                    "Aerial hoist complete! Bird's eye view of the harbor!",
                    "Full throttle drop! Rescue Bots, roll to the rescue!"
                ],
                BOUNCE: [
                    "Sky-high bounce! Heatwave airborne!",
                    "Super bounce engaged! Woohoo!"
                ]
            },
            CHASE: {
                DEPLOY: [
                    "Chase on patrol! Ready to protect and serve Griffin Rock!",
                    "Officer Chase reporting! All rescue protocols active!"
                ],
                TO_VEHICLE: [
                    "Chase, transform! Police cruiser in pursuit!",
                    "Sirens ready! Rescue Bots, roll to the rescue!"
                ],
                TO_DINO: [
                    "Chase, Dinobot mode! Stegosaurus armor engaged!",
                    "Transforming to Stegosaurus! Stand back, citizens!"
                ],
                TO_BOT: [
                    "Chase, transform! Robot mode, standing by!",
                    "Back on two feet! Area secure, Chief!"
                ],
                RESCUE: [
                    "Hazard secured! Citizens of Griffin Rock, you are safe now!",
                    "By the book! Emergency resolved, team!"
                ],
                WASH: [
                    "Regulations satisfied: police cruiser cleanliness at one hundred percent!",
                    "Clean, polished, and ready for patrol!"
                ],
                STUNT: [
                    "Pursuit velocity exceeded! Outstanding aerial maneuver!",
                    "High-speed aerial jump executed!"
                ],
                WEATHER_SUNNY: [
                    "Atmospheric conditions: optimal. Visibility: one hundred percent!",
                    "Daylight patrol underway. All streets clear!"
                ],
                WEATHER_RAIN: [
                    "Advisory: wet pavement ahead. Police cruiser traction control engaged!",
                    "Storm precautions in effect. Driving with caution!"
                ],
                WEATHER_VOLCANO: [
                    "Thermal warning from Volcano Ridge. Enforcing safe perimeter!",
                    "Caldera seismic activity detected. Stand by for emergency response!"
                ],
                WEATHER_NIGHT: [
                    "Night patrol protocol initiated. All beacons illuminated.",
                    "Cruiser headlights engaged. Griffin Rock is secure under our watch."
                ],
                CATAPULT: [
                    "Emergency launch authorized! High-speed deployment!",
                    "Pursuit speed achieved from takeoff!"
                ],
                DINER: [
                    "Drive-thru order complete. Energy replenishment at 100 percent!",
                    "Nutritional fuel acquired. Back on the beat!"
                ],
                CHARGER: [
                    "Maximum overdrive engaged! Speed regulations suspended for emergency!",
                    "All electrical systems operating at peak voltage!"
                ],
                GROUNDBRIDGE: [
                    "Sub-space transit logged and approved! Area reached instantly!",
                    "Instant deployment across sector boundaries!"
                ],
                FERRY: [
                    "Maritime patrol protocol active! Harbor perimeter secure!",
                    "Shipboard stability confirmed. Excellent voyage!"
                ],
                CRANE: [
                    "High-altitude crane maneuver authorized! Outstanding aerial clearance!",
                    "Aerial deployment executed by the book!"
                ],
                BOUNCE: [
                    "Vertical trajectory optimal! Approaching peak altitude!",
                    "High-velocity vertical rebound confirmed!"
                ]
            },
            BLADES: {
                DEPLOY: [
                    "Blades ready for takeoff! Let's fly to the rescue!",
                    "Blades here! Rescue winch and rotors checked!"
                ],
                TO_VEHICLE: [
                    "Blades, transform! Rotors up, taking to the skies!",
                    "Helicopter mode! Rescue Bots, fly to the rescue!"
                ],
                TO_DINO: [
                    "Blades, Dinobot mode! Soaring like a Pterosaur!",
                    "Pterosaur wings out! Swooping in for air rescue!"
                ],
                TO_BOT: [
                    "Blades, transform! Touching down in robot mode!",
                    "Back on solid ground! Robot mode ready!"
                ],
                RESCUE: [
                    "Woohoo! Air rescue complete! Everyone is safe and sound!",
                    "We did it! High-flying Rescue Bots save the day!"
                ],
                WASH: [
                    "Woohoo! That tickles! Rotor blades all shiny and clean!",
                    "Freshly washed and ready to soar!"
                ],
                STUNT: [
                    "Woohoo! Look at me soar! That's a sky stunt!",
                    "Now that was prime flight formation!"
                ],
                WEATHER_SUNNY: [
                    "Warm sunshine and clear skies! Woohoo! Perfect day for flying!",
                    "Blue skies and sunshine! Flying high over Griffin Rock!"
                ],
                WEATHER_RAIN: [
                    "Flying through the rain! It's like a free rotor wash!",
                    "A little bumpy in the clouds, but Blades can handle it!"
                ],
                WEATHER_VOLCANO: [
                    "Ooh, look at those glowing embers! Better keep our altitude!",
                    "Warm updrafts from the volcano! Flying carefully!"
                ],
                WEATHER_NIGHT: [
                    "Look at the northern lights! The sky looks magical tonight!",
                    "Night flight! Look at all the town lights down there!"
                ],
                CATAPULT: [
                    "Hold on to your rotors! BEST LAUNCH EVER!",
                    "Woohoo! Up, up, and away!"
                ],
                DINER: [
                    "Woohoo! Curly fries and an Energon smoothie! My favorite!",
                    "Can I get extra napkins? Rotor blades get messy!"
                ],
                CHARGER: [
                    "Wooooohoooo! Look at that turbo speed! Super-copter mode!",
                    "Turbos spinning at maximum velocity!"
                ],
                GROUNDBRIDGE: [
                    "Whoa! Did everything just turn inside out? THAT WAS AWESOME!",
                    "GroundBridge travel is almost as fast as flying!"
                ],
                FERRY: [
                    "Helicopter landing on the ferry helipad! Woohoo!",
                    "Look at the dolphins jumping in the bay!"
                ],
                CRANE: [
                    "Woohoo! I'm flying without even spinning my rotors! DO IT AGAIN!",
                    "Highest drop on the island! Woohoooo!"
                ],
                BOUNCE: [
                    "Wooooohoooo! Even higher than my helicopter ceiling! Best bounce ever!",
                    "Look at me soar! That's anti-gravity!"
                ]
            },
            OPTIMUS: {
                DEPLOY: [
                    "Optimus Prime deployed. Autobots, roll to the rescue!",
                    "Freedom is the right of all sentient beings. Rescue Bots, proceed!"
                ],
                DOCK: [
                    "Autobots, roll out! Super Rig command trailer combined into Apex Mega mode!",
                    "Apex Battle Rig fully engaged! Energon systems at maximum output!"
                ],
                UNDOCK: [
                    "Trailer decoupled. Returning to agile command mode.",
                    "Disengaging Super Rig. Autobots, maintain positions!"
                ],
                TO_VEHICLE: [
                    "Optimus Prime, transform! Heavy cab truck mode!",
                    "Cab engine engaged! Leading the convoy!"
                ],
                TO_DINO: [
                    "Optimus Prime, Primal T-Rex mode! ROAR!",
                    "Primal energon power! Dinobot T-Rex online!"
                ],
                TO_BOT: [
                    "Optimus Prime, robot mode! Stand together, heroes!",
                    "Back in robot mode! Ready to protect Griffin Rock!"
                ],
                RESCUE: [
                    "Crisis resolved. Excellent teamwork, Autobots!",
                    "Griffin Rock remains secure under our watchful guard."
                ],
                WASH: [
                    "Optimus Prime: maintenance complete and chassis restored.",
                    "Clean and operational. Roll out!"
                ],
                STUNT: [
                    "Even a heavy cab can achieve great heights!",
                    "Autobots know no limits!"
                ]
            },
            BUMBLEBEE: {
                DEPLOY: [
                    "Bumblebee here, ready to buzz into action!",
                    "Hey partner, let's show Griffin Rock what we can do!"
                ],
                TO_VEHICLE: [
                    "Bumblebee, transform! Speedster mode, hitting top gear!",
                    "Yellow lightning on wheels! Roll to the rescue!"
                ],
                TO_DINO: [
                    "Bumblebee, Raptor Dinobot mode! RAWR!",
                    "Velociraptor rescan engaged! Watch the talons!"
                ],
                TO_BOT: [
                    "Bumblebee, robot mode! Ready to rescue!",
                    "Back on two feet! Let's save the day!"
                ],
                RESCUE: [
                    "Woohoo! Another rescue in the books!",
                    "That's how the Autobots get it done!"
                ],
                WASH: [
                    "Clean as a whistle! Ready to race!",
                    "Yellow paint job is shining bright!"
                ],
                STUNT: [
                    "Did you see that hangtime?! Awesome!",
                    "Stunt jump cleared! That was thrilling!"
                ]
            },
            BLURR: {
                DEPLOY: [
                    "Blurr is on the track! Fastest bot in the galaxy, let's go-go-go!",
                    "Need speed?! I'm already there before you even asked!"
                ],
                TO_VEHICLE: [
                    "Blurr, transform! Cyber-speedster hyper-drive!",
                    "Zero to three hundred, blink and you'll miss me!"
                ],
                TO_DINO: [
                    "Blurr, Gallimimus Dinobot mode! Supersonic sprint!",
                    "Fastest dinosaur in the galaxy! Try and catch a Gallimimus!"
                ],
                TO_BOT: [
                    "Blurr, robot mode! What's next, what's next, what's next?!",
                    "Back in bot mode and ready for high-speed action!"
                ],
                RESCUE: [
                    "Emergency resolved at supersonic speed!",
                    "Fastest rescue in Griffin Rock history!"
                ],
                WASH: [
                    "Quick pit-stop! Wash and wax in two point two seconds flat!",
                    "Aerodynamic polish complete! Back to top speed!"
                ],
                STUNT: [
                    "Orbital trajectory achieved! Wooooosh!",
                    "Mach five jump! Try and keep up!"
                ]
            },
            SALVAGE: {
                DEPLOY: [
                    "Salvage on duty! One bot's scrap is another bot's treasure!",
                    "Ready to clear any debris and lend a heavy hand!"
                ],
                TO_VEHICLE: [
                    "Salvage, transform! Recycling truck compactor mode!",
                    "Heavy hauler rolling out! Keeping the streets clean!"
                ],
                TO_DINO: [
                    "Salvage, Ankylosaurus Dinobot mode! Heavy armor up!",
                    "Club-tail slam! Rock-solid protection!"
                ],
                TO_BOT: [
                    "Salvage, robot mode! Ready to sort and salvage!",
                    "Strong hands and a big heart! Let's help!"
                ],
                RESCUE: [
                    "All cleared and recycled safely! Happy to help!",
                    "Everything is clean, safe, and restored!"
                ],
                WASH: [
                    "A good wash gets all the harbor grime off! Feels great!",
                    "Cleaned up and ready for heavy hauling!"
                ],
                STUNT: [
                    "Heavy trucks can fly too! Whoopee!",
                    "Big air for big machinery!"
                ]
            },
            HIGHTIDE: {
                DEPLOY: [
                    "High Tide reporting for duty! Ocean command standing by!",
                    "Attention on deck! Deep-sea rescue specialist ready!"
                ],
                DOCK: [
                    "Megabot Exo-Armor engaged! Ready to take on anything!",
                    "Neural link synchronized! Cybertronian vessel combined into Megabot mode!"
                ],
                UNDOCK: [
                    "Exo-Armor disengaged. Returning to agile reconnaissance mode.",
                    "Separating from rescue vessel. Standing by for offshore patrol."
                ],
                TO_VEHICLE: [
                    "High Tide, transform! Submarine mode engaged!",
                    "Hydro-thrusters engaged! Submerging into deep water!"
                ],
                TO_DINO: [
                    "High Tide, Plesiosaur Dinobot mode! Tidal surge!",
                    "Ocean ruler awakened! Navigating the depths!"
                ],
                TO_BOT: [
                    "High Tide, robot mode! Discipline and vigilance!",
                    "On solid ground, but my heart is with the sea!"
                ],
                RESCUE: [
                    "Mission accomplished with naval precision!",
                    "The waters and shores are secure once more!"
                ],
                WASH: [
                    "Freshwater rinse complete! Salt spray cleared from hull!",
                    "Ship-shape and Bristol fashion!"
                ],
                STUNT: [
                    "Launching over the crest! Steady as she goes!",
                    "Full speed ahead and into the skies!"
                ]
            },
            QUICKSHADOW: {
                DEPLOY: [
                    "I am where you don't think I am! Quickshadow on mission!",
                    "Covert operations active. Style, stealth, and supreme speed!"
                ],
                TO_VEHICLE: [
                    "Quickshadow, transform! Luxury sports coupe mode!",
                    "Turbo overdrive engaged! You won't even see me coming!"
                ],
                TO_DINO: [
                    "Quickshadow, Dilophosaur Dinobot mode! Silent strike!",
                    "Shadow stalker unleashed! Swift, silent, and untraceable!"
                ],
                TO_BOT: [
                    "Quickshadow, robot mode! Direct, precise, and completely effective.",
                    "Back in bot mode. Let's finish this assignment with flair!"
                ],
                RESCUE: [
                    "Mission completed flawlessly. Child's play, really!",
                    "Target secured and danger neutralized. Never in doubt!"
                ],
                WASH: [
                    "A spotless polish for a pristine agent. Splendid!",
                    "Not a speck of dust on the bodywork. Perfection!"
                ],
                STUNT: [
                    "Aerodynamic excellence at high altitude!",
                    "High-flying elegance! Catch me if you can!"
                ]
            }
        };

        // botPhraseCounters exported in gameState.js
const _localPhraseCounters = { BOULDER: 0, HEATWAVE: 0, CHASE: 0, BLADES: 0, OPTIMUS: 0, BUMBLEBEE: 0, BLURR: 0, SALVAGE: 0, HIGHTIDE: 0, QUICKSHADOW: 0 };

        export function speakBotCatchphrase(botType, eventKey) {
            const botLines = BOT_CATCHPHRASES[botType] && BOT_CATCHPHRASES[botType][eventKey];
            const meta = BOT_METADATA[botType];
            if (!botLines || !meta) return;
            const idx = (botPhraseCounters[botType]++) % botLines.length;
            const line = botLines[idx];
            triggerNPCSpeech(meta.name, meta.role, line, player, true);
        }


        export function syncHUDToActiveBot() {
            let meta = BOT_METADATA[player.botType];
            if (player.botType === 'HIGHTIDE' && progression.highTideDocked) {
                meta = {
                    ...meta,
                    name: 'HIGH TIDE (MEGABOT)',
                    role: 'Titan Seafaring Exo-Armor',
                    vehName: 'RESCUE SHIP',
                    dinoName: 'TITAN MOSASAUR',
                    botActionLabel: 'CRANE SMASH',
                    vehActionLabel: 'HYDRO CANNON',
                    dinoActionLabel: 'LEVIATHAN CHOMP'
                };
            } else if (player.botType === 'OPTIMUS' && progression.optimusDocked) {
                meta = BOT_METADATA.OPTIMUS_MEGA || meta;
            }
            const isVeh = player.mode === 'VEHICLE';
            const isDino = player.mode === 'DINO';
            const modeLabel = isDino ? `${meta.dinoName} MODE` : (isVeh ? `${meta.vehName} MODE` : `BOT MODE`);

            document.getElementById('mode-readout').textContent = `${meta.name} • ${modeLabel}`;
            document.getElementById('mode-readout').className = `text-xs sm:text-sm font-bold tracking-wide uppercase ${meta.colorClass}`;
            document.getElementById('mode-dot').className = `w-2.5 h-2.5 rounded-full ${meta.dotClass}`;

            let nextTransformLabel = 'TO ROBOT';
            if (player.botType === 'HIGHTIDE') {
                const nearWater = isNearWater(player.pos.x, player.pos.z, 24.0);
                if (player.mode === 'BOT') {
                    nextTransformLabel = nearWater ? `TO ${meta.vehName}` : `TO ${meta.dinoName}`;
                } else if (player.mode === 'VEHICLE') {
                    nextTransformLabel = `TO ${meta.dinoName}`;
                } else {
                    nextTransformLabel = 'TO ROBOT';
                }
            } else {
                nextTransformLabel = player.mode === 'BOT'
                    ? `TO ${meta.vehName}`
                    : (player.mode === 'VEHICLE' ? (meta.dinoName ? `TO ${meta.dinoName}` : 'TO ROBOT') : 'TO ROBOT');
            }
            document.getElementById('transform-sub').textContent = nextTransformLabel;

            const actionKey = isDino
                ? meta.dinoActionIcon
                : (isVeh ? meta.vehActionIcon : meta.botActionIcon);
            const actionIconEl = document.getElementById('action-icon');
            if (actionIconEl) {
                actionIconEl.innerHTML = SVG_ICONS[actionKey] || '';
            }
            document.getElementById('action-label').textContent = isDino
                ? meta.dinoActionLabel
                : (isVeh ? meta.vehActionLabel : meta.botActionLabel);

            const btnAction = document.getElementById('btn-action');
            if (btnAction) {
                const botKey = (player.botType || 'BOULDER').toLowerCase();
                btnAction.className = `tactile-btn w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center text-white select-none mb-1.5 action-btn-${botKey} bg-gradient-to-b ${meta.btnActionBg || ''}`;
            }

            // Megabot / Super Rig Undock Button
            const btnUndock = document.getElementById('btn-undock');
            if (btnUndock) {
                const isMegaActive = (player.botType === 'HIGHTIDE' && progression.highTideDocked) ||
                                     (player.botType === 'OPTIMUS' && progression.optimusDocked);
                if (isMegaActive) {
                    btnUndock.classList.remove('hidden');
                } else {
                    btnUndock.classList.add('hidden');
                }
            }

            // Optional Emergency Siren Toggle Button (Shown for Heatwave & Chase)
            const hasSiren = (player.botType === 'HEATWAVE' || player.botType === 'CHASE');
            const btnSiren = document.getElementById('btn-siren');
            const sirenLabel = document.getElementById('siren-label');
            if (btnSiren) {
                if (hasSiren) {
                    btnSiren.classList.remove('hidden');
                    if (player.sirenActive) {
                        btnSiren.className = "tactile-btn siren-on w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center text-white select-none";
                        if (sirenLabel) sirenLabel.textContent = 'SIREN ON';
                    } else {
                        btnSiren.className = "tactile-btn siren-off w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center text-white select-none";
                        if (sirenLabel) sirenLabel.textContent = 'SIREN';
                    }
                } else {
                    btnSiren.classList.add('hidden');
                }
            }

            // Helicopter & Pterosaur Flight UI vs Ground Bot UI
            const isFlyingCopter = (player.botType === 'BLADES' && (isVeh || isDino));
            const btnDescend = document.getElementById('btn-descend');
            const altSep = document.getElementById('altitude-sep');
            const altReadout = document.getElementById('altitude-readout');

            const jumpIconEl = document.getElementById('jump-icon');
            if (isFlyingCopter) {
                btnDescend.classList.remove('hidden');
                altSep.classList.remove('hidden');
                altReadout.classList.remove('hidden');
                if (jumpIconEl) jumpIconEl.innerHTML = SVG_ICONS.ASCEND;
                document.getElementById('jump-label').textContent = 'ASCEND';
            } else {
                btnDescend.classList.add('hidden');
                altSep.classList.add('hidden');
                altReadout.classList.add('hidden');
                if (jumpIconEl) jumpIconEl.innerHTML = isVeh ? SVG_ICONS.SONAR : SVG_ICONS.JUMP;
                document.getElementById('jump-label').textContent = isVeh ? 'SONAR' : 'JUMP';
            }

            // Update visibility of newly discovered ally bot selector buttons
            updateBotRosterUI();

            // Highlight active bot card in Bottom-Left Roster
            document.querySelectorAll('.bot-card').forEach(btn => {
                const bType = btn.dataset.bot;
                if (bType === player.botType) {
                    btn.classList.add('active-bot');
                    btn.classList.remove('buddy-bot');
                } else if (bType === buddyBot.botType) {
                    btn.classList.remove('active-bot');
                    btn.classList.add('buddy-bot');
                } else {
                    btn.classList.remove('active-bot');
                    btn.classList.remove('buddy-bot');
                }
            });

            const buddyMeta = BOT_METADATA[buddyBot.botType];
            const buddyReadout = document.getElementById('buddy-readout');
            if (buddyReadout && buddyMeta) {
                buddyReadout.textContent = `BUDDY: ${buddyMeta.name}`;
            }
        }

        // Returns currently playable bots (4 OG Bots + Any Discovered Visiting Allies)
        export function getUnlockedPlayableBots() {
            const base = ['BOULDER', 'HEATWAVE', 'CHASE', 'BLADES'];
            const allies = Array.isArray(progression.discoveredAllies) ? progression.discoveredAllies : [];
            const validAllies = ['OPTIMUS', 'BUMBLEBEE', 'BLURR', 'SALVAGE', 'HIGHTIDE', 'QUICKSHADOW'].filter(id => allies.includes(id));
            return [...base, ...validAllies];
        }

        // Dynamically toggle visibility of bot selector buttons based on discovery
        export function updateBotRosterUI() {
            const unlocked = getUnlockedPlayableBots();
            document.querySelectorAll('.bot-card').forEach(btn => {
                const bType = btn.dataset.bot;
                if (unlocked.includes(bType)) {
                    btn.classList.remove('hidden');
                } else {
                    btn.classList.add('hidden');
                }
            });
        }

        export function cycleBuddyBot() {
            const allBots = getUnlockedPlayableBots();
            const candidateBots = allBots.filter(b => b !== player.botType);
            if (candidateBots.length === 0) return;
            const currentIdx = candidateBots.indexOf(buddyBot.botType);
            const nextBot = candidateBots[(currentIdx + 1) % candidateBots.length];
            setBuddyBot(nextBot);
        }

        export function unlockAndSwitchBot(botType) {
            if (!Array.isArray(progression.discoveredAllies)) {
                progression.discoveredAllies = [];
            }
            if (!progression.discoveredAllies.includes(botType)) {
                progression.discoveredAllies.push(botType);
                saveProgression();
                updateBotRosterUI();
            }
            switchRescueBot(botType);
        }


        export function setBuddyBot(botType) {
            if (botType === player.botType) return;
            buddyBot.botType = botType;
            progression.buddyBotType = botType;
            saveProgression();

            // Teleport or place buddy smoothly right behind player (or safely on shore if High Tide is in water)
            const backDist = 7.5;
            const sideDist = 4.2;
            buddyBot.heading = player.heading;
            if (player.botType === 'HIGHTIDE' && (isPointInWater(player.pos.x, player.pos.z) || player.mode === 'VEHICLE' || player.pos.y < 0.25)) {
                // If High Tide is in water, keep or place buddy safely on land
                if (!isPointInWater(buddyBot.pos.x, buddyBot.pos.z) && buddyBot.pos.y >= 0.35) {
                    // Buddy is already on dry land, hold position
                } else {
                    buddyBot.pos.set(-85, 1.2, 1420); // Harbor pier / shore promenade
                }
            } else {
                buddyBot.pos.set(
                    player.pos.x - Math.sin(player.heading) * backDist - Math.cos(player.heading) * sideDist,
                    player.pos.y,
                    player.pos.z - Math.cos(player.heading) * backDist + Math.sin(player.heading) * sideDist
                );
            }
            buddyBot.speed = player.speed;
            buddyBot.flightAlt = (botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) ? Math.max(14, player.flightAlt) : 0;
            sfx.playWaypointTap();
            const bMeta = BOT_METADATA[botType];
            showToast("RESCUE WINGMAN", `${bMeta.name} is now your Buddy Bot!`);
            triggerNPCSpeech(bMeta.name, "Wingman Partner", `I'm right behind you, ${BOT_METADATA[player.botType].name}! Ready to rescue!`, buddyBot, true);
            syncVisitingAutobotsVisibility();
            syncHUDToActiveBot();
        }

        export function switchRescueBot(newBotType) {
            if (newBotType === player.botType) {
                speakBotCatchphrase(newBotType, 'DEPLOY');
                return;
            }
            const oldBotType = player.botType;
            player.botType = newBotType;
            player.hasWaypoint = false;
            waypointGroup.visible = false;
            if (newBotType !== 'HEATWAVE' && newBotType !== 'CHASE') {
                player.sirenActive = false;
            }
            sfx.playBotSwitch();

            // If player switched to current buddy bot, swap old player bot to become the buddy bot!
            if (buddyBot.botType === newBotType) {
                buddyBot.botType = oldBotType;
                progression.buddyBotType = oldBotType;
                saveProgression();
            }

            // If switching to Blades while already in vehicle or dino mode, lift into flight
            if (newBotType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) {
                player.flightAlt = Math.max(player.flightAlt, 14);
            } else if (newBotType !== 'BLADES') {
                player.flightAlt = 0;
            }

            // High Tide submarine and plesiosaur modes require water; if deployed on dry land, revert to Bot mode
            if (newBotType === 'HIGHTIDE' && (player.mode === 'VEHICLE' || player.mode === 'DINO') && !isNearWater(player.pos.x, player.pos.z, 22.0)) {
                player.mode = 'BOT';
                player.targetMorph = 0.0;
                player.targetDinoMorph = 0.0;
                player.morph = 0.0;
                player.dinoMorph = 0.0;
            }

            // High Tide Megabot Docking Persistence:
            // If switching to High Tide and player was previously docked in Megabot mode, restore Megabot form!
            if (newBotType === 'HIGHTIDE') {
                const isMega = Boolean(progression.highTideDocked);
                setHighTideRigMega(botRigs['HIGHTIDE'], isMega);
                if (highTideWorldShip) highTideWorldShip.visible = !isMega;
            } else if (oldBotType === 'HIGHTIDE') {
                // When switching away from High Tide, High Tide and his boat both appear in the world!
                if (highTideWorldShip) highTideWorldShip.visible = true;
            }

            // Optimus Prime Mega Docking Persistence:
            if (newBotType === 'OPTIMUS') {
                const isMega = Boolean(progression.optimusDocked);
                setOptimusRigMega(botRigs['OPTIMUS'], isMega);
                if (optimusWorldTrailer) optimusWorldTrailer.visible = !isMega;
            } else if (oldBotType === 'OPTIMUS') {
                if (optimusWorldTrailer) optimusWorldTrailer.visible = true;
            }

            syncVisitingAutobotsVisibility();
            syncHUDToActiveBot();
            showToast("RESCUE BOTS ROSTER", `${BOT_METADATA[newBotType].name} Deployed!`);
            speakBotCatchphrase(newBotType, 'DEPLOY');
        }

        export function updateAllBotTransforms(dt, now) {
            // Smoothly interpolate active player vehicle & dino morphs (~0.95s duration matching the 5-step transformation sound!)
            const morphSpeed = 1.05;
            if (player.morph < player.targetMorph) {
                player.morph = Math.min(player.targetMorph, player.morph + dt * morphSpeed);
            } else if (player.morph > player.targetMorph) {
                player.morph = Math.max(player.targetMorph, player.morph - dt * morphSpeed);
            }

            if (player.dinoMorph < player.targetDinoMorph) {
                player.dinoMorph = Math.min(player.targetDinoMorph, player.dinoMorph + dt * morphSpeed);
            } else if (player.dinoMorph > player.targetDinoMorph) {
                player.dinoMorph = Math.max(player.targetDinoMorph, player.dinoMorph - dt * morphSpeed);
            }

            // Buddy Bot mirrors player mode & morphs
            buddyBot.targetMorph = player.targetMorph;
            buddyBot.targetDinoMorph = player.targetDinoMorph;
            if (buddyBot.morph < buddyBot.targetMorph) {
                buddyBot.morph = Math.min(buddyBot.targetMorph, buddyBot.morph + dt * morphSpeed);
            } else if (buddyBot.morph > buddyBot.targetMorph) {
                buddyBot.morph = Math.max(buddyBot.targetMorph, buddyBot.morph - dt * morphSpeed);
            }
            if (buddyBot.dinoMorph < buddyBot.targetDinoMorph) {
                buddyBot.dinoMorph = Math.min(buddyBot.targetDinoMorph, buddyBot.dinoMorph + dt * morphSpeed);
            } else if (buddyBot.dinoMorph > buddyBot.targetDinoMorph) {
                buddyBot.dinoMorph = Math.max(buddyBot.targetDinoMorph, buddyBot.dinoMorph - dt * morphSpeed);
            }

            Object.keys(botRigs).forEach(botKey => {
                const rig = botRigs[botKey];
                if (botKey === 'HIGHTIDE') {
                    const shouldBeMega = Boolean(
                        (botKey === player.botType && progression.highTideDocked) ||
                        (botKey === buddyBot.botType && progression.highTideDocked)
                    );
                    if (rig.isMega !== shouldBeMega) {
                        setHighTideRigMega(rig, shouldBeMega);
                    }
                }
                if (botKey === 'OPTIMUS') {
                    const shouldBeMega = Boolean(
                        (botKey === player.botType && progression.optimusDocked) ||
                        (botKey === buddyBot.botType && progression.optimusDocked)
                    );
                    if (rig.isMega !== shouldBeMega) {
                        setOptimusRigMega(rig, shouldBeMega);
                    }
                }
                if (botKey === player.botType) {
                    // Active Bot follows player physics position & heading
                    rig.root.visible = true;
                    rig.root.position.copy(player.pos);
                    rig.root.rotation.y = player.heading;
                    // Forward pitch tilt for Blades when flying; Terrain pitch & roll slope adaptation for Ground Vehicles
                    if (botKey === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) {
                        rig.chassis.rotation.x = THREE.MathUtils.lerp(rig.chassis.rotation.x, (player.speed / 65) * 0.28, dt * 6);
                        rig.chassis.rotation.z = THREE.MathUtils.lerp(rig.chassis.rotation.z, 0, dt * 6);
                    } else if (player.mode === 'VEHICLE' || player.mode === 'DINO') {
                        rig.chassis.rotation.x = -player.pitch;
                        rig.chassis.rotation.z = player.roll;
                    } else {
                        rig.chassis.rotation.x = -player.pitch * 0.35;
                        rig.chassis.rotation.z = player.roll * 0.35;
                    }
                    applyBotRigMorph(rig, player.morph, player.dinoMorph, player.walkCycle, player.speed, player.smashTimer, now, player.scoopTimer);
                } else if (botKey === buddyBot.botType) {
                    // Buddy Bot follows wingman physics position & heading
                    rig.root.visible = true;
                    rig.root.position.copy(buddyBot.pos);
                    rig.root.rotation.y = buddyBot.heading;
                    if (botKey === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) {
                        rig.chassis.rotation.x = THREE.MathUtils.lerp(rig.chassis.rotation.x, (buddyBot.speed / 65) * 0.28, dt * 6);
                        rig.chassis.rotation.z = THREE.MathUtils.lerp(rig.chassis.rotation.z, 0, dt * 6);
                    } else if (player.mode === 'VEHICLE' || player.mode === 'DINO') {
                        rig.chassis.rotation.x = -buddyBot.pitch;
                        rig.chassis.rotation.z = buddyBot.roll;
                    } else {
                        rig.chassis.rotation.x = -buddyBot.pitch * 0.35;
                        rig.chassis.rotation.z = buddyBot.roll * 0.35;
                    }
                    applyBotRigMorph(rig, buddyBot.morph, buddyBot.dinoMorph, buddyBot.walkCycle, buddyBot.speed, buddyBot.smashTimer, now, buddyBot.scoopTimer);
                } else {
                    // Inactive Bots stay parked in standby at Rescue Bots Headquarters or hidden if secret ally!
                    const slot = HQ_PARKING_SLOTS[botKey];
                    if (slot) {
                        // Performance optimization: Cull inactive parked bot rigs when beyond 140m of camera
                        const camDist = Math.hypot(camera.position.x - slot.x, camera.position.z - slot.z);
                        if (camDist > 140) {
                            rig.root.visible = false;
                        } else {
                            rig.root.visible = true;
                            rig.root.position.set(slot.x, slot.y, slot.z);
                            rig.root.rotation.y = slot.rotY;
                            rig.chassis.rotation.x = 0;
                            rig.chassis.rotation.z = 0;
                            applyBotRigMorph(rig, slot.morph, 0, 0, 0, 0, now);
                        }
                    } else {
                        rig.root.visible = false;
                        rig.root.position.set(0, -999, 0);
                    }
                }
            });

            // Sync World NPC visibility with active player character (hide in world while actively controlled)
            if (typeof visitingAutobots !== 'undefined') {
                for (let a = 0; a < visitingAutobots.length; a++) {
                    const ally = visitingAutobots[a];
                    if (ally.root) {
                        ally.root.visible = (player.botType !== ally.id && buddyBot.botType !== ally.id);
                    }
                }
            }
        }


        export function setPlayerMode(nextMode) {
            if (nextMode === 'VEHICLE') {
                if (player.botType === 'HIGHTIDE' && !isNearWater(player.pos.x, player.pos.z, 22.0)) {
                    showToast("🌊 WATER REQUIRED TO SUBMERGE", "High Tide's submarine mode requires water! Head to the harbor or shoreline!");
                    sfx.playSpeechPop();
                    return;
                }
                player.mode = 'VEHICLE';
                player.targetMorph = 1.0;
                player.targetDinoMorph = 0.0;
                sfx.playTransform(true);
                if (player.botType === 'BLADES') {
                    player.flightAlt = Math.max(player.flightAlt, 16);
                    player.grounded = false;
                }
                speakBotCatchphrase(player.botType, 'TO_VEHICLE');
            } else if (nextMode === 'DINO') {
                if (player.botType === 'HIGHTIDE' && !isNearWater(player.pos.x, player.pos.z, 22.0)) {
                    showToast("🌊 WATER REQUIRED TO DIVE", "High Tide's plesiosaur dinobot mode requires water! Head to the harbor or shoreline!");
                    sfx.playSpeechPop();
                    return;
                }
                player.mode = 'DINO';
                player.targetMorph = 0.0;
                player.targetDinoMorph = 1.0;
                sfx.playTransform(true);
                sfx.playDinoRoar(player.botType);
                if (player.botType === 'BLADES') {
                    player.flightAlt = Math.max(player.flightAlt, 18);
                    player.grounded = false;
                } else {
                    player.flightAlt = 0;
                }
                const meta = BOT_METADATA[player.botType];
                showToast("DINOBOT MODE!", `${meta.name} • ${meta.dinoName}!`);
                speakBotCatchphrase(player.botType, 'TO_DINO');
            } else {
                player.mode = 'BOT';
                player.targetMorph = 0.0;
                player.targetDinoMorph = 0.0;
                player.flightAlt = 0;
                sfx.playTransform(false);
                speakBotCatchphrase(player.botType, 'TO_BOT');
            }
            syncHUDToActiveBot();
        }

        export function dockHighTideMegabot() {
            if (player.botType !== 'HIGHTIDE' || progression.highTideDocked) return;
            progression.highTideDocked = true;
            saveProgression();

            sfx.playTransform(true);
            if (typeof sfx.playRankUp === 'function') sfx.playRankUp();
            spawnBurstParticles(player.pos.x, player.pos.y + 4.0, player.pos.z, 0x06b6d4, 32, 2.2);
            spawnBurstParticles(player.pos.x, player.pos.y + 2.0, player.pos.z, 0xfacc15, 24, 1.8);

            if (highTideWorldShip) {
                highTideWorldShip.visible = false;
            }

            const rig = botRigs['HIGHTIDE'];
            if (rig) {
                setHighTideRigMega(rig, true);
            }

            showToast("⚓ MEGABOT EXO-ARMOR ENGAGED!", "High Tide combined with Oceanic Rescue Vessel!");
            speakBotCatchphrase('HIGHTIDE', 'DOCK');
            syncHUDToActiveBot();
        }

        export function undockHighTideMegabot() {
            if (player.botType !== 'HIGHTIDE' || !progression.highTideDocked) return;
            progression.highTideDocked = false;
            saveProgression();

            sfx.playTransform(false);
            spawnBurstParticles(player.pos.x, player.pos.y + 2.5, player.pos.z, 0x38bdf8, 22, 1.6);

            if (highTideWorldShip) {
                // Return ship to harbor bay mooring or nearby in water
                if (isNearWater(player.pos.x, player.pos.z, 30.0)) {
                    const shipAngle = player.heading + Math.PI * 0.5;
                    highTideWorldShip.position.set(
                        player.pos.x + Math.sin(shipAngle) * 16.0,
                        -0.45,
                        player.pos.z + Math.cos(shipAngle) * 16.0
                    );
                    highTideWorldShip.rotation.y = player.heading;
                } else {
                    highTideWorldShip.position.set(-95, -0.45, 1480);
                    highTideWorldShip.rotation.y = 0.35;
                }
                highTideWorldShip.visible = true;
            }

            const rig = botRigs['HIGHTIDE'];
            if (rig) {
                setHighTideRigMega(rig, false);
            }

            showToast("⚓ MEGABOT EXO-ARMOR DISENGAGED", "High Tide returned to Reconnaissance Mode.");
            speakBotCatchphrase('HIGHTIDE', 'UNDOCK');
            syncHUDToActiveBot();
        }

        export function dockOptimusMegabot() {
            if (player.botType !== 'OPTIMUS' || progression.optimusDocked) return;
            progression.optimusDocked = true;
            saveProgression();

            sfx.playTransform(true);
            if (typeof sfx.playRankUp === 'function') sfx.playRankUp();
            spawnBurstParticles(player.pos.x, player.pos.y + 4.0, player.pos.z, 0xdc2626, 32, 2.2);
            spawnBurstParticles(player.pos.x, player.pos.y + 2.0, player.pos.z, 0x06b6d4, 28, 2.0);

            if (optimusWorldTrailer) {
                optimusWorldTrailer.visible = false;
            }

            const rig = botRigs['OPTIMUS'];
            if (rig) {
                setOptimusRigMega(rig, true);
            }

            showToast("🚚 APEX SUPER RIG ENGAGED!", "Optimus Prime docked with Heavy Command Trailer!");
            speakBotCatchphrase('OPTIMUS', 'DOCK');
            syncHUDToActiveBot();
        }

        export function undockOptimusMegabot() {
            if (player.botType !== 'OPTIMUS' || !progression.optimusDocked) return;
            progression.optimusDocked = false;
            saveProgression();

            sfx.playTransform(false);
            spawnBurstParticles(player.pos.x, player.pos.y + 2.5, player.pos.z, 0xdc2626, 22, 1.6);

            if (optimusWorldTrailer) {
                const hqDist = Math.hypot(player.pos.x - (-22), player.pos.z - (-38));
                if (hqDist < 35.0) {
                    optimusWorldTrailer.position.set(-22, 0.1, -38);
                    optimusWorldTrailer.rotation.y = 0;
                } else {
                    const trailerAngle = player.heading + Math.PI;
                    optimusWorldTrailer.position.set(
                        player.pos.x + Math.sin(trailerAngle) * 14.0,
                        0.1,
                        player.pos.z + Math.cos(trailerAngle) * 14.0
                    );
                    optimusWorldTrailer.rotation.y = player.heading;
                }
                optimusWorldTrailer.visible = true;
            }

            const rig = botRigs['OPTIMUS'];
            if (rig) {
                setOptimusRigMega(rig, false);
            }

            showToast("🚚 SUPER RIG DISENGAGED", "Optimus Prime decoupled from Command Trailer.");
            speakBotCatchphrase('OPTIMUS', 'UNDOCK');
            syncHUDToActiveBot();
        }

        // Transform Cycle (Robot -> Vehicle -> Dinobot -> Robot)
        export function triggerTransform() {
            const hasDino = BOT_METADATA[player.botType] && BOT_METADATA[player.botType].dinoName;
            if (player.botType === 'HIGHTIDE') {
                const nearWater = isNearWater(player.pos.x, player.pos.z, 24.0);
                if (player.mode === 'BOT') {
                    if (nearWater) {
                        setPlayerMode('VEHICLE');
                    } else {
                        // High Tide's Dino Mode is fully amphibious and can roam seamlessly on land or ocean water!
                        setPlayerMode('DINO');
                        const isMega = Boolean(progression.highTideDocked);
                        showToast("🦖 AMPHIBIOUS DINO MODE", `High Tide transformed into ${isMega ? 'Titan Mosasaur' : 'Amphibious Plesiosaur'}!`);
                    }
                } else if (player.mode === 'VEHICLE') {
                    setPlayerMode('DINO');
                } else {
                    setPlayerMode('BOT');
                }
                return;
            }
            if (player.mode === 'BOT') {
                setPlayerMode('VEHICLE');
            } else if (player.mode === 'VEHICLE') {
                if (hasDino) {
                    setPlayerMode('DINO');
                } else {
                    setPlayerMode('BOT');
                }
            } else {
                setPlayerMode('BOT');
            }
        }

        export function checkHitMorBotWithSpecialAbility(attackRadius = 48.0, attackName = "") {
            if (typeof morbotBattle === 'undefined' || !morbotBattle || (morbotBattle.state !== 'PURSUIT' && morbotBattle.state !== 'ROBOT')) {
                return false;
            }
            if (morbotBattle.hp <= 0 || morbotBattle.invulnerableTimer > 0) {
                return false;
            }
            const dx = morbotBattle.pos.x - player.pos.x;
            const dz = morbotBattle.pos.z - player.pos.z;
            const dist = Math.hypot(dx, dz);

            // Forward direction check
            const toMorBotAng = Math.atan2(dx, dz);
            let angleDiff = Math.abs(toMorBotAng - player.heading);
            while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

            // Target cone: within forward hemisphere (< 1.5 rad) up to attackRadius, or point-blank melee (< 8m):
            const inForwardCone = angleDiff < 1.5 && dist <= attackRadius;
            const inCloseBlast = dist <= 8.0;

            if (inForwardCone || inCloseBlast) {
                morbotBattle.damageMorBot(1, attackName);
                spawnBurstParticles(morbotBattle.pos.x, morbotBattle.pos.y + 2.0, morbotBattle.pos.z, 0x38bdf8, 22, 1.8);
                spawnEnergonLightningParticles(morbotBattle.pos.x, morbotBattle.pos.y + 2.2, morbotBattle.pos.z, 18);
                return true;
            }
            return false;
        }

        // Bot-Specific Special Action (Adapts across Bot, Vehicle, and Dinobot Modes!)
        export function triggerPrimaryAction() {
            // Check MorBot hit with active bot's special ability
            const currentBotMeta = BOT_METADATA[player.botType];
            const botAttackName = currentBotMeta ? `${currentBotMeta.name} ${currentBotMeta.powerName || "SPECIAL POWER"}` : "HEROIC SPECIAL POWER";
            checkHitMorBotWithSpecialAbility(48.0, botAttackName);

            if (player.botType === 'HEATWAVE') {
                // Aimed High-Pressure Water Cannon Arc (from Ladder Turret or Brachiosaur Snout!)
                player.waterTimer = 1.65;
                if (player.mode === 'DINO') {
                    player.smashTimer = 0.45;
                    sfx.playDinoRoar('HEATWAVE');
                }
                sfx.playWaterSpray();
                checkHitMorBotWithSpecialAbility(34.0, "WATER CANNON");
                return;
            }

            if (player.botType === 'CHASE') {
                // Police Energy Net & Tow Winch / Stegosaurus Tail Spike EMP Shockwave!
                player.sonarTimer = 1.45;
                player.netTimer = 1.35;
                checkHitMorBotWithSpecialAbility(30.0, "STINGER EMP");

                // Target the closest uncleared hazard node within 26m, or deploy 12m in front of Chase!
                let targetNode = null;
                let bestDist = 26.0;
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared) {
                            const d = Math.hypot(player.pos.x - n.x, player.pos.z - n.z);
                            if (d < bestDist) {
                                bestDist = d;
                                targetNode = n;
                            }
                        }
                    });
                });

                if (targetNode) {
                    player.netTarget.set(targetNode.x, targetNode.y + 0.5, targetNode.z);
                } else {
                    const tx = player.pos.x + Math.sin(player.heading) * 12.0;
                    const tz = player.pos.z + Math.cos(player.heading) * 12.0;
                    player.netTarget.set(tx, Math.max(0, getTerrainHeight(tx, tz)) + 0.5, tz);
                }

                if (player.mode === 'DINO') {
                    player.smashTimer = 0.45;
                    sfx.playDinoRoar('CHASE');
                } else {
                    sfx.playSirenPulse();
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && (Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 18.5 || Math.hypot(player.netTarget.x - n.x, player.netTarget.z - n.z) < 10.0)) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                return;
            }

            if (player.botType === 'BLADES') {
                // Helicopter Rescue Winch & Rotor Cyclone / Pterosaur Wing Gale!
                player.winchTimer = 1.65;
                player.sonarTimer = 1.45;
                if (player.mode === 'DINO') {
                    sfx.playDinoRoar('BLADES');
                } else {
                    sfx.playSmash();
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 20.5) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                return;
            }

            if (player.botType === 'OPTIMUS') {
                const isMega = Boolean(progression.optimusDocked);
                const clearRadius = isMega ? 38.0 : 25.0;

                if (player.mode === 'DINO') {
                    // T-REX DINOBOT MODE: Primal T-Rex Roar & Seismic Ground Stomp!
                    player.smashTimer = isMega ? 0.75 : 0.65;
                    sfx.playDinoRoar('OPTIMUS');
                    sfx.playSmash();
                    spawnBurstParticles(
                        player.pos.x + Math.sin(player.heading) * (isMega ? 6.5 : 3.8),
                        player.pos.y + 0.8,
                        player.pos.z + Math.cos(player.heading) * (isMega ? 6.5 : 3.8),
                        0xdc2626,
                        isMega ? 28 : 18,
                        isMega ? 2.6 : 1.8
                    );
                    spawnBurstParticles(
                        player.pos.x + Math.sin(player.heading) * (isMega ? 6.5 : 3.8),
                        player.pos.y + 0.8,
                        player.pos.z + Math.cos(player.heading) * (isMega ? 6.5 : 3.8),
                        0x2563eb,
                        isMega ? 24 : 14,
                        isMega ? 2.2 : 1.5
                    );
                    spawnBurstParticles(
                        player.pos.x,
                        player.pos.y + 0.2,
                        player.pos.z,
                        0xfacc15,
                        isMega ? 28 : 16,
                        isMega ? 2.8 : 2.0
                    );
                    beacons.forEach(beacon => {
                        beacon.nodes.forEach(n => {
                            if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < clearRadius) {
                                clearHazardNode(beacon, n);
                            }
                        });
                    });
                    showToast(
                        isMega ? "🦖 PRIMAL EARTHQUAKE!" : "🦖 PRIMAL T-REX ROAR!",
                        isMega ? "Mega Optimus unleashes a devastating seismic titan shockwave!" : "Optimus Prime unleashes a seismic dinosaur shockwave!"
                    );
                    return;
                } else if (player.mode === 'VEHICLE') {
                    player.boostTimer = isMega ? 2.4 : 1.6;
                    player.speed = Math.max(player.speed, isMega ? 46.0 : 36.0);
                    if (isMega) {
                        player.waterTimer = 2.2;
                        sfx.playWaterSpray();
                    }
                    sfx.playSmash();
                } else {
                    player.smashTimer = isMega ? 0.7 : 0.55;
                    if (isMega) {
                        sfx.playSmash();
                        sfx.playEnergonCollect();
                    } else {
                        sfx.playEnergonCollect();
                        sfx.playBeaconRestore();
                    }
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < clearRadius) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                spawnBurstParticles(
                    player.pos.x + Math.sin(player.heading) * (isMega ? 4.5 : 3.5),
                    player.pos.y + (isMega ? 1.5 : 1.2),
                    player.pos.z + Math.cos(player.heading) * (isMega ? 4.5 : 3.5),
                    isMega ? 0x06b6d4 : 0x38bdf8,
                    isMega ? 28 : 16,
                    isMega ? 2.2 : 1.6
                );
                if (isMega) {
                    spawnBurstParticles(
                        player.pos.x + Math.sin(player.heading) * 4.5,
                        player.pos.y + 1.5,
                        player.pos.z + Math.cos(player.heading) * 4.5,
                        0xdc2626,
                        20,
                        2.0
                    );
                }
                return;
            }

            if (player.botType === 'BUMBLEBEE') {
                // BUMBLEBEE: Stinger Pulse Blasters / Nitro Turbo / Velociraptor Pounce Leap!
                if (player.mode === 'DINO') {
                    player.smashTimer = 0.5;
                    player.vy = 24.0;
                    player.grounded = false;
                    player.boostTimer = 1.4;
                    sfx.playDinoRoar('BUMBLEBEE');
                } else if (player.mode === 'VEHICLE') {
                    player.boostTimer = 1.8;
                    player.speed = Math.max(player.speed, 42.0);
                    sfx.playStuntChime();
                } else {
                    player.smashTimer = 0.4;
                    sfx.playSirenPulse();
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 20.0) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                spawnBurstParticles(
                    player.pos.x + Math.sin(player.heading) * 3.0,
                    player.pos.y + 0.8,
                    player.pos.z + Math.cos(player.heading) * 3.0,
                    0xfacc15,
                    14,
                    1.3
                );
                return;
            }

            if (player.botType === 'BLURR') {
                if (player.mode === 'DINO') {
                    // GALLIMIMUS: Sonic Stride Supersonic Dash & Lightning Sprint!
                    player.boostTimer = 2.4;
                    player.speed = Math.max(player.speed, 64.0);
                    sfx.playDinoRoar('BLURR');
                    sfx.playStuntChime();
                } else {
                    player.boostTimer = 2.2;
                    player.speed = Math.max(player.speed, 52.0);
                    sfx.playStuntChime();
                    sfx.playTransform(false);
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 24.0) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                spawnBurstParticles(
                    player.pos.x,
                    player.pos.y + 0.5,
                    player.pos.z,
                    0xa855f7,
                    18,
                    1.8
                );
                spawnBurstParticles(
                    player.pos.x,
                    player.pos.y + 0.5,
                    player.pos.z,
                    0x22c55e,
                    12,
                    1.4
                );
                return;
            }

            if (player.botType === 'SALVAGE') {
                if (player.mode === 'DINO') {
                    // ANKYLOSAURUS: Heavy Wrecking Club Tail Smash & Ground Shockwave!
                    player.smashTimer = 0.65;
                    sfx.playDinoRoar('SALVAGE');
                    sfx.playRockBreak();
                } else {
                    player.scoopTimer = 1.2;
                    player.smashTimer = 0.5;
                    sfx.playRockBreak();
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 24.0) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                spawnBurstParticles(
                    player.pos.x + Math.sin(player.heading) * 4.0,
                    player.pos.y + 0.7,
                    player.pos.z + Math.cos(player.heading) * 4.0,
                    0x84cc16,
                    16,
                    1.5
                );
                return;
            }

            if (player.botType === 'HIGHTIDE') {
                const isMega = Boolean(progression.highTideDocked);
                const clearRadius = isMega ? 38.0 : 24.0;
                player.smashTimer = isMega ? 0.6 : 0.45;

                if (player.mode === 'DINO') {
                    player.waterTimer = isMega ? 2.8 : 2.0;
                    sfx.playDinoRoar('HIGHTIDE');
                    sfx.playWaterSpray();
                } else {
                    player.waterTimer = isMega ? 2.5 : 1.8;
                    sfx.playWaterSpray();
                    sfx.playSmash();
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < clearRadius) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                spawnBurstParticles(
                    player.pos.x + Math.sin(player.heading) * (isMega ? 7.0 : 4.0),
                    player.pos.y + (isMega ? 1.5 : 0.8),
                    player.pos.z + Math.cos(player.heading) * (isMega ? 7.0 : 4.0),
                    0x38bdf8,
                    isMega ? 32 : 18,
                    isMega ? 2.4 : 1.6
                );
                return;
            }

            if (player.botType === 'QUICKSHADOW') {
                if (player.mode === 'DINO') {
                    // DILOPHOSAURUS: Shadow Ambush Stealth Leap & Covert Strike!
                    player.boostTimer = 2.2;
                    player.smashTimer = 0.55;
                    player.speed = Math.max(player.speed, 54.0);
                    sfx.playDinoRoar('QUICKSHADOW');
                    sfx.playStuntChime();
                } else {
                    player.boostTimer = 2.0;
                    player.speed = Math.max(player.speed, 48.0);
                    sfx.playSirenPulse();
                    sfx.playStuntChime();
                }
                beacons.forEach(beacon => {
                    beacon.nodes.forEach(n => {
                        if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 24.0) {
                            clearHazardNode(beacon, n);
                        }
                    });
                });
                spawnBurstParticles(
                    player.pos.x,
                    player.pos.y + 0.6,
                    player.pos.z,
                    0x38bdf8,
                    22,
                    1.7
                );
                spawnSparkleGlints(player.pos.x, player.pos.y + 1.2, player.pos.z, 18);
                return;
            }
            player.scoopTimer = 0.85;
            player.smashTimer = 0.45;
            if (player.mode === 'DINO') {
                player.boostTimer = 1.25;
                sfx.playDinoRoar('BOULDER');
            } else {
                if (player.mode === 'VEHICLE') player.boostTimer = 1.15;
                sfx.playSmash();
            }
            beacons.forEach(beacon => {
                beacon.nodes.forEach(n => {
                    if (!n.cleared && Math.hypot(player.pos.x - n.x, player.pos.z - n.z) < 16.5) {
                        clearHazardNode(beacon, n);
                    }
                });
            });
            spawnBurstParticles(
                player.pos.x + Math.sin(player.heading) * 4.2,
                player.pos.y + 0.6,
                player.pos.z + Math.cos(player.heading) * 4.2,
                0xfacc15,
                10,
                1.15
            );
        }

        export function triggerSecondaryAction() {
            if (player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) {
                player.flightAlt = Math.min(95, player.flightAlt + 12);
                sfx.playFlightAscend();
                checkHitMorBotWithSpecialAbility(48.0, "ROTOR GALE");
                return;
            }
            if ((player.mode === 'BOT' || player.mode === 'DINO') && player.grounded) {
                player.vy = player.energonBoostTimer > 0 ? 28.5 : 21.0;
                player.grounded = false;
                sfx.playSmash();
                checkHitMorBotWithSpecialAbility(45.0, "SEISMIC STOMP");
            } else {
                player.sonarTimer = 1.5;
                sfx.playSirenPulse();
                checkHitMorBotWithSpecialAbility(45.0, "SONAR PULSE SCAN");
            }
        }

        export function triggerDescendAction() {
            if (player.botType === 'BLADES' && (player.mode === 'VEHICLE' || player.mode === 'DINO')) {
                player.flightAlt = Math.max(2, player.flightAlt - 12);
                sfx.playFlightDescend();
            }
        }

        export function toggleSiren() {
            if (player.botType !== 'HEATWAVE' && player.botType !== 'CHASE') return;
            sfx.init();
            player.sirenActive = !player.sirenActive;
            if (player.sirenActive) {
                sfx.playSirenPulse();
            }
            syncHUDToActiveBot();
        }


if (typeof window !== 'undefined') {
    window.speakBotCatchphrase = speakBotCatchphrase;
    window.syncHUDToActiveBot = syncHUDToActiveBot;
    window.getUnlockedPlayableBots = getUnlockedPlayableBots;
    window.updateBotRosterUI = updateBotRosterUI;
    window.cycleBuddyBot = cycleBuddyBot;
    window.unlockAndSwitchBot = unlockAndSwitchBot;
    window.setBuddyBot = setBuddyBot;
    window.switchRescueBot = switchRescueBot;
    window.updateAllBotTransforms = updateAllBotTransforms;
    window.setPlayerMode = setPlayerMode;
    window.dockHighTideMegabot = dockHighTideMegabot;
    window.undockHighTideMegabot = undockHighTideMegabot;
    window.dockOptimusMegabot = dockOptimusMegabot;
    window.undockOptimusMegabot = undockOptimusMegabot;
    window.triggerTransform = triggerTransform;
    window.triggerPrimaryAction = triggerPrimaryAction;
    window.triggerSecondaryAction = triggerSecondaryAction;
    window.triggerDescendAction = triggerDescendAction;
    window.toggleSiren = toggleSiren;
}

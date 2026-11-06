// Metadata, Parking Slots & Ground Contact Offsets for all 10 Rescue Bots & Megabot

export const HQ_POS = { x: -48, z: -45 }; // Rescue Bots Firehouse HQ base coordinates

export const BOT_METADATA = {
    BOULDER: {
        name: 'BOULDER',
        role: 'Construction Rescue Bot',
        voicePitch: 0.82,
        vehName: 'BULLDOZER',
        dinoName: 'TRICERATOPS',
        colorClass: 'text-lime-300',
        dotClass: 'bg-lime-400',
        btnActionBg: 'from-lime-500 via-emerald-600 to-green-700 border-lime-300',
        botActionIcon: 'QUAKE_SMASH',
        botActionLabel: 'QUAKE SMASH',
        vehActionIcon: 'DOZER_SCOOP',
        vehActionLabel: 'DOZER SCOOP',
        dinoActionIcon: 'TRICERA_CHARGE',
        dinoActionLabel: 'TRICERA CHARGE'
    },
    HEATWAVE: {
        name: 'HEATWAVE',
        role: 'Fire Rescue Leader',
        voicePitch: 0.88,
        vehName: 'FIRE ENGINE',
        dinoName: 'BRACHIOSAUR',
        colorClass: 'text-rose-300',
        dotClass: 'bg-rose-500',
        btnActionBg: 'from-rose-500 via-red-600 to-orange-700 border-red-300',
        botActionIcon: 'WATER_CANNON',
        botActionLabel: 'WATER CANNON',
        vehActionIcon: 'HYDRO_DELUGE',
        vehActionLabel: 'HYDRO DELUGE',
        dinoActionIcon: 'DINO_HYDRO_JET',
        dinoActionLabel: 'DINO HYDRO JET'
    },
    CHASE: {
        name: 'CHASE',
        role: 'Police Rescue Bot',
        voicePitch: 0.98,
        vehName: 'POLICE CRUISER',
        dinoName: 'STEGOSAURUS',
        colorClass: 'text-sky-300',
        dotClass: 'bg-sky-400',
        btnActionBg: 'from-sky-500 via-blue-600 to-indigo-800 border-sky-300',
        botActionIcon: 'ENERGY_NET',
        botActionLabel: 'ENERGY NET',
        vehActionIcon: 'TOW_WINCH_NET',
        vehActionLabel: 'TOW WINCH NET',
        dinoActionIcon: 'TAIL_SPIKE_EMP',
        dinoActionLabel: 'TAIL SPIKE EMP'
    },
    BLADES: {
        name: 'BLADES',
        role: 'Air Rescue Copter',
        voicePitch: 1.15,
        vehName: 'HELICOPTER',
        dinoName: 'PTEROSAUR',
        colorClass: 'text-amber-300',
        dotClass: 'bg-amber-400',
        btnActionBg: 'from-amber-400 via-orange-500 to-red-600 border-amber-200',
        botActionIcon: 'ROTOR_CYCLONE',
        botActionLabel: 'ROTOR CYCLONE',
        vehActionIcon: 'RESCUE_WINCH',
        vehActionLabel: 'RESCUE WINCH',
        dinoActionIcon: 'WING_GALE',
        dinoActionLabel: 'WING GALE'
    },
    OPTIMUS: {
        name: 'OPTIMUS PRIME',
        role: 'Autobot Supreme Commander',
        scale: 1.25,
        voicePitch: 0.72,
        vehName: 'HEAVY CAB TRUCK',
        dinoName: 'T-REX',
        colorClass: 'text-red-400',
        dotClass: 'bg-red-600',
        btnActionBg: 'from-blue-600 via-red-600 to-blue-900 border-red-300',
        botActionIcon: 'MATRIX_PULSE',
        botActionLabel: 'MATRIX PULSE',
        vehActionIcon: 'CAB_BOOST',
        vehActionLabel: 'CAB BOOST',
        dinoActionIcon: 'T_REX_ROAR',
        dinoActionLabel: 'T-REX ROAR'
    },
    OPTIMUS_MEGA: {
        name: 'OPTIMUS PRIME (MEGA)',
        role: 'Supreme Commander Apex Rig',
        scale: 1.65,
        voicePitch: 0.70,
        vehName: 'SUPER RIG TRANSPORTER',
        dinoName: 'MEGA T-REX TITAN',
        colorClass: 'text-red-400',
        dotClass: 'bg-red-600',
        btnActionBg: 'from-blue-600 via-red-600 to-blue-900 border-red-300',
        botActionIcon: 'MATRIX_PULSE',
        botActionLabel: 'APEX ENERGON AXE',
        vehActionIcon: 'CAB_BOOST',
        vehActionLabel: 'MEGA WATER CANNON',
        dinoActionIcon: 'T_REX_ROAR',
        dinoActionLabel: 'PRIMAL EARTHQUAKE'
    },
    BUMBLEBEE: {
        name: 'BUMBLEBEE',
        role: 'Autobot Scout & Dinobot Ally',
        voicePitch: 1.14,
        vehName: 'SPORTS SPEEDSTER',
        dinoName: 'VELOCIRAPTOR',
        colorClass: 'text-yellow-300',
        dotClass: 'bg-yellow-400',
        btnActionBg: 'from-yellow-400 via-amber-500 to-yellow-600 border-yellow-200',
        botActionIcon: 'STINGER_PULSE',
        botActionLabel: 'STINGER PULSE',
        vehActionIcon: 'NITRO_TURBO',
        vehActionLabel: 'NITRO TURBO',
        dinoActionIcon: 'RAPTOR_LEAP',
        dinoActionLabel: 'RAPTOR LEAP'
    },
    BLURR: {
        name: 'BLURR',
        role: 'Hyper-Speed Rescue Specialist',
        voicePitch: 1.28,
        vehName: 'CYBER-SPEEDSTER',
        dinoName: 'GALLIMIMUS',
        colorClass: 'text-purple-300',
        dotClass: 'bg-purple-500',
        btnActionBg: 'from-purple-500 via-violet-600 to-fuchsia-800 border-purple-300',
        botActionIcon: 'HYPER_BLUR',
        botActionLabel: 'HYPER BLUR',
        vehActionIcon: 'SUPERSONIC_DASH',
        vehActionLabel: 'SUPERSONIC DASH',
        dinoActionIcon: 'SUPERSONIC_DASH',
        dinoActionLabel: 'SONIC STRIDE'
    },
    SALVAGE: {
        name: 'SALVAGE',
        role: 'Reclamation & Recycling Hero',
        voicePitch: 0.82,
        vehName: 'RECYCLING TRUCK',
        dinoName: 'ANKYLOSAUR',
        colorClass: 'text-lime-300',
        dotClass: 'bg-lime-400',
        btnActionBg: 'from-lime-500 via-blue-600 to-slate-800 border-lime-300',
        botActionIcon: 'SCRAP_MAGNET',
        botActionLabel: 'SCRAP MAGNET',
        vehActionIcon: 'COMPACTOR_SMASH',
        vehActionLabel: 'COMPACTOR SMASH',
        dinoActionIcon: 'COMPACTOR_SMASH',
        dinoActionLabel: 'TAIL SMASH'
    },
    HIGHTIDE: {
        name: 'HIGH TIDE',
        role: 'Deep-Ocean Rescue Commander',
        scale: 1.30,
        voicePitch: 0.76,
        vehName: 'SUBMARINE',
        dinoName: 'PLESIOSAUR',
        colorClass: 'text-blue-400',
        dotClass: 'bg-blue-600',
        btnActionBg: 'from-cyan-500 via-blue-700 to-slate-900 border-cyan-300',
        botActionIcon: 'TIDAL_SURGE',
        botActionLabel: 'TIDAL SURGE',
        vehActionIcon: 'HYDRO_TORPEDO',
        vehActionLabel: 'HYDRO TORPEDO',
        dinoActionIcon: 'TIDAL_SURGE',
        dinoActionLabel: 'PLESIO SURGE'
    },
    QUICKSHADOW: {
        name: 'QUICKSHADOW',
        role: 'Covert Operations Specialist',
        voicePitch: 1.22,
        vehName: 'LUXURY COUPE',
        dinoName: 'DILOPHOSAUR',
        colorClass: 'text-sky-300',
        dotClass: 'bg-sky-400',
        btnActionBg: 'from-slate-100 via-sky-600 to-slate-900 border-sky-300',
        botActionIcon: 'STEALTH_CLOAK',
        botActionLabel: 'STEALTH CLOAK',
        vehActionIcon: 'TURBO_OVERDRIVE',
        vehActionLabel: 'TURBO OVERDRIVE',
        dinoActionIcon: 'STEALTH_CLOAK',
        dinoActionLabel: 'SHADOW AMBUSH'
    }
};

export const HQ_GROUND_Y = 4.68;
export const HQ_ROOF_Y = 21.30;

export const HQ_PARKING_SLOTS = {
    BOULDER:  { x: HQ_POS.x - 11, y: HQ_GROUND_Y, z: HQ_POS.z + 8, rotY: 0, morph: 1.0 },
    HEATWAVE: { x: HQ_POS.x + 0,  y: HQ_GROUND_Y, z: HQ_POS.z + 8, rotY: 0, morph: 1.0 },
    CHASE:    { x: HQ_POS.x + 11, y: HQ_GROUND_Y, z: HQ_POS.z + 8, rotY: 0, morph: 1.0 },
    BLADES:   { x: HQ_POS.x - 8,  y: HQ_ROOF_Y,   z: HQ_POS.z,     rotY: 0.4, morph: 1.0 }
};

// Calibrated Ground Clearance Offsets
export const BOT_GROUND_OFFSETS = {
    BOULDER:       { bot: 0.36, veh: 0.00, dino: 0.79 },
    HEATWAVE:      { bot: 0.53, veh: 0.00, dino: 0.68 },
    CHASE:         { bot: 0.40, veh: 0.00, dino: 0.50 },
    BLADES:        { bot: 1.28, veh: 0.00, dino: 0.84 },
    OPTIMUS:       { bot: 0.552, veh: 0.544, dino: 0.648 },
    OPTIMUS_MEGA:  { bot: 0.552, veh: 0.544, dino: 0.648 },
    BUMBLEBEE:     { bot: 0.41, veh: 0.58, dino: 0.51 },
    BLURR:         { bot: 0.73, veh: 0.63, dino: 0.83 },
    SALVAGE:       { bot: 0.46, veh: 0.15, dino: 0.56 },
    HIGHTIDE:      { bot: 0.692, veh: 0.808, dino: 0.792 },
    HIGHTIDE_MEGA: { bot: 0.00, veh: 1.226, dino: 1.405 },
    QUICKSHADOW:   { bot: 0.72, veh: 0.37, dino: 0.82 }
};

if (typeof window !== 'undefined') {
    Object.assign(window, {
        BOT_METADATA,
        HQ_PARKING_SLOTS,
        BOT_GROUND_OFFSETS
    });
}

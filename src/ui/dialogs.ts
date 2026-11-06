// UI Dialogs, Speech Bubbles, NPC English Voice & Toast Notifications
import { player, buddyBot, humanNPCs } from '../state/gameState.js';
import { BOT_METADATA } from '../bots/botMeta.js';
import { sfx } from '../audio/soundFX.js';

export const SPEAKER_AVATARS = {
    'HEATWAVE': '🚒',
    'CHASE': '🚓',
    'BLADES': '🚁',
    'BOULDER': '🚜',
    'CHIEF CHARLIE BURNS': '👮‍♂️',
    'CODY BURNS': '👦',
    'DANI BURNS': '👩‍✈️',
    'KADE BURNS': '👨‍🚒',
    'GRAHAM BURNS': '👷‍♂️',
    'DOC GREENE': '👨‍🔬',
    'DOC EZRA GREENE': '👨‍🔬',
    'FRANKIE GREENE': '👧',
    'MAYOR LUSKEY': '🎩',
    'HUXLEY PRESCOTT': '🎙️',
    'CAPTAIN SHAW': '⚓',
    'RANGER TAYLOR': '🌲',
    'DINER': '🍔',
    'GRIFFIN DINER': '🍔',
    'DRIVE-THRU': '🍔',
    'INTERCOM': '📻',
    'CATAPULT': '🚀',
    'GROUNDBRIDGE': '🌀',
    'ENERGON': '⚡',
    'FERRY': '🚢',
    'CRANE': '🏗️',
    'TESTING YARD': '🧪',
    'BOUNCE': '🦘',
    'TARGET': '🎯',
    'OPTIMUS PRIME': '🚛',
    'OPTIMUS': '🚛',
    'BUMBLEBEE': '🏎️',
    'BLURR': '🏎️💨',
    'SALVAGE': '🚛♻️',
    'HIGH TIDE': '🚢⚓',
    'SERVO': '🤖🐶'
};

export function getSpeakerAvatar(name, role) {
    const upper = (name || '').toUpperCase();
    for (const key in SPEAKER_AVATARS) {
        if (upper.includes(key)) return SPEAKER_AVATARS[key];
    }
    if (/CHIEF|POLICE/i.test(role)) return '👮‍♂️';
    if (/PILOT|FLIGHT/i.test(role)) return '👩‍✈️';
    if (/FIRE/i.test(role)) return '👨‍🚒';
    if (/ENGINEER|CREW/i.test(role)) return '👷‍♂️';
    if (/SCIENTIST|TECH/i.test(role)) return '👨‍🔬';
    if (/CITIZEN|RESCUED/i.test(role)) return '🙋';
    return '💬';
}

export function findSpeakerSource(speakerName) {
    if (!speakerName) return player;
    const upper = speakerName.toUpperCase();
    if (BOT_METADATA[player.botType] && BOT_METADATA[player.botType].name.toUpperCase() === upper) {
        return player;
    }
    if (buddyBot && buddyBot.botType && BOT_METADATA[buddyBot.botType] && BOT_METADATA[buddyBot.botType].name.toUpperCase() === upper) {
        return buddyBot;
    }
    for (let i = 0; i < humanNPCs.length; i++) {
        if (humanNPCs[i].name && humanNPCs[i].name.toUpperCase() === upper) {
            return humanNPCs[i];
        }
    }
    const visitingAutobots = typeof window !== 'undefined' ? window.visitingAutobots : null;
    if (visitingAutobots) {
        for (let k = 0; k < visitingAutobots.length; k++) {
            const ally = visitingAutobots[k];
            if (ally.name && (ally.name.toUpperCase() === upper || upper.includes(ally.id))) {
                const isOccupied = (player.botType === ally.id) || (buddyBot && buddyBot.botType === ally.id);
                if (isOccupied) {
                    return (player.botType === ally.id) ? player : buddyBot;
                }
                return ally;
            }
        }
    }
    return player;
}

export const activeSpeech = {
    visible: false,
    source: null,
    speakerName: "",
    speakerRole: "",
    speechText: "",
    timer: 0,
    yOffset: 3.3
};

let activeSpeechTimer = null;
let lastGlobalVoiceTime = -99;

export function triggerNPCSpeech(speakerName, speakerRole, speechText, targetOrPitch = null, isDirectPlayerLine = false, isEmergencyCall = false): any {
    const nowSec = performance.now() / 1000;
    if (nowSec - lastGlobalVoiceTime < 0.85 && !isDirectPlayerLine && !isEmergencyCall) {
        return;
    }
    lastGlobalVoiceTime = nowSec;

    const bubble = document.getElementById('speech-bubble');
    const speakerEl = document.getElementById('speech-speaker');
    const roleEl = document.getElementById('speech-role');
    const textEl = document.getElementById('speech-text');
    const avatarEl = document.getElementById('speech-avatar');

    if (!bubble || !speakerEl || !textEl) return;

    if (activeSpeechTimer) clearTimeout(activeSpeechTimer);

    speakerEl.textContent = speakerName || 'Griffin Rock Citizen';
    if (roleEl) roleEl.textContent = speakerRole || 'Islander';
    textEl.textContent = speechText;
    if (avatarEl) avatarEl.textContent = getSpeakerAvatar(speakerName, speakerRole);

    let pitch = 1.0;
    if (typeof targetOrPitch === 'number') {
        pitch = targetOrPitch;
    } else if (targetOrPitch && typeof targetOrPitch.voicePitch === 'number') {
        pitch = targetOrPitch.voicePitch;
    }

    if (sfx) {
        sfx.playNPCSpeech(speechText, pitch);
    }

    bubble.classList.remove('hidden');

    activeSpeech.visible = true;
    activeSpeech.source = (typeof targetOrPitch === 'object' && targetOrPitch) ? targetOrPitch : findSpeakerSource(speakerName);
    activeSpeech.speakerName = speakerName;
    activeSpeech.speakerRole = speakerRole;
    activeSpeech.speechText = speechText;
    activeSpeech.yOffset = 3.3;
    activeSpeech.timer = 6.0;

    const duration = Math.min(8500, Math.max(3400, speechText.length * 90));
    activeSpeechTimer = setTimeout(() => {
        bubble.classList.add('hidden');
    }, duration);
}

export function showToast(subtitle, title) {
    const banner = document.getElementById('toast-banner');
    if (!banner) return;
    const sub = document.getElementById('toast-subtitle');
    const tit = document.getElementById('toast-title');
    if (sub) sub.textContent = subtitle;
    if (tit) tit.textContent = title;
    banner.classList.remove('hidden');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        banner.classList.add('hidden');
    }, 3100);
}

if (typeof window !== 'undefined') {
    window.SPEAKER_AVATARS = SPEAKER_AVATARS;
    window.activeSpeech = activeSpeech;
    window.getSpeakerAvatar = getSpeakerAvatar;
    window.findSpeakerSource = findSpeakerSource;
    window.triggerNPCSpeech = triggerNPCSpeech;
    window.showToast = showToast;
}

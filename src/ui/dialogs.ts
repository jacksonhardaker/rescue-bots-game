// UI Dialogs, Speech Bubbles, NPC English Voice & Toast Notifications
import { player, buddyBot, humanNPCs } from '../state/gameState.js';
import { BOT_METADATA } from '../bots/botMeta.js';
import { sfx } from '../audio/soundFX.js';
import { SVG_ICONS } from './icons.js';

export const SPEAKER_AVATARS: Record<string, string> = {
    'HEATWAVE': SVG_ICONS.HEATWAVE,
    'CHASE': SVG_ICONS.CHASE,
    'BLADES': SVG_ICONS.BLADES,
    'BOULDER': SVG_ICONS.BOULDER,
    'OPTIMUS PRIME': SVG_ICONS.OPTIMUS,
    'OPTIMUS': SVG_ICONS.OPTIMUS,
    'BUMBLEBEE': SVG_ICONS.BUMBLEBEE,
    'BLURR': SVG_ICONS.BLURR,
    'SALVAGE': SVG_ICONS.SALVAGE,
    'HIGH TIDE': SVG_ICONS.HIGHTIDE,
    'HIGHTIDE': SVG_ICONS.HIGHTIDE,
    'QUICKSHADOW': SVG_ICONS.QUICKSHADOW,
    'STARSPEED': SVG_ICONS.STARSPEED,
    'RATCHET': SVG_ICONS.RATCHET,
    'HOSPITAL': SVG_ICONS.HOSPITAL,
    'ENERGON': SVG_ICONS.BOLT,
    'CATAPULT': SVG_ICONS.ROCKET,
    'SIGMA': SVG_ICONS.ROCKET,
    'MOON': SVG_ICONS.MOON
};

export function getSpeakerAvatar(name: string, role: string): string {
    const upper = (name || '').toUpperCase();
    for (const key in SPEAKER_AVATARS) {
        if (upper.includes(key) && SPEAKER_AVATARS[key]) return SPEAKER_AVATARS[key];
    }
    if (/PATIENT|MEDICAL|MATERNITY|INJURED|HOSPITAL/i.test(role)) return SVG_ICONS.MED_CROSS;
    if (/RESCUE|BOT|AUTOBOT|COMMANDER/i.test(role)) return SVG_ICONS.STAR;
    if (/SCIENTIST|TECH|ENGINEER/i.test(role)) return SVG_ICONS.BOLT;
    return SVG_ICONS.PEOPLE;
}

interface VisitingAutobotRef {
    id: string;
    name?: string;
    voicePitch?: number;
    [key: string]: unknown;
}

export type SpeechTarget = { voicePitch?: number; [key: string]: unknown };

export function findSpeakerSource(speakerName: string): unknown {
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
    const visitingAutobots = typeof window !== 'undefined' && Array.isArray(window.visitingAutobots)
        ? (window.visitingAutobots as VisitingAutobotRef[])
        : null;
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

export const activeSpeech: {
    visible: boolean;
    source: unknown;
    speakerName: string;
    speakerRole: string;
    speechText: string;
    timer: number;
    yOffset: number;
} = {
    visible: false,
    source: null,
    speakerName: "",
    speakerRole: "",
    speechText: "",
    timer: 0,
    yOffset: 3.3
};

let activeSpeechTimer: ReturnType<typeof setTimeout> | null = null;
let lastGlobalVoiceTime = -99;

export function triggerNPCSpeech(
    speakerName: string,
    speakerRole: string,
    speechText: string,
    targetOrPitch: number | SpeechTarget | null = null,
    isDirectPlayerLine = false,
    isEmergencyCall = false
): void {
    const nowSec = performance.now() / 1000;
    if (nowSec - lastGlobalVoiceTime < 0.85 && !isDirectPlayerLine && !isEmergencyCall) {
        return;
    }
    lastGlobalVoiceTime = nowSec;

    const bubble = document.getElementById('npc-world-bubble') || document.getElementById('speech-bubble');
    const speakerEl = document.getElementById('world-speaker-name') || document.getElementById('speech-speaker');
    const roleEl = document.getElementById('world-speaker-role') || document.getElementById('speech-role');
    const textEl = document.getElementById('world-speech-text') || document.getElementById('speech-text');
    const avatarEl = document.getElementById('world-speaker-avatar') || document.getElementById('speech-avatar');

    if (!bubble || !speakerEl || !textEl) return;

    if (activeSpeechTimer) clearTimeout(activeSpeechTimer);

    speakerEl.textContent = speakerName || 'Griffin Rock Citizen';
    if (roleEl) roleEl.textContent = speakerRole || 'Islander';
    textEl.textContent = speechText;
    if (avatarEl) avatarEl.innerHTML = getSpeakerAvatar(speakerName, speakerRole);

    let pitch = 1.0;
    if (typeof targetOrPitch === 'number') {
        pitch = targetOrPitch;
    } else if (targetOrPitch && typeof targetOrPitch.voicePitch === 'number') {
        pitch = targetOrPitch.voicePitch;
    } else if (speakerName) {
        const upperSpeaker = speakerName.toUpperCase();
        for (const key in BOT_METADATA) {
            if (upperSpeaker.includes(key) || BOT_METADATA[key].name.toUpperCase() === upperSpeaker) {
                pitch = BOT_METADATA[key].voicePitch || 1.0;
                break;
            }
        }
    }

    if (sfx && typeof sfx.playSpeechPop === 'function') {
        sfx.playSpeechPop(pitch);
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

const _STRIP_EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2300}-\u{23FF}\u{FE0F}]/gu;

export function showToast(subtitle: string, title: string) {
    const banner = document.getElementById('toast-banner');
    if (!banner) return;
    const sub = document.getElementById('toast-subtitle');
    const tit = document.getElementById('toast-title');
    if (sub) sub.textContent = String(subtitle || '').replace(_STRIP_EMOJI_RE, '').trim();
    if (tit) tit.textContent = String(title || '').replace(_STRIP_EMOJI_RE, '').trim();
    banner.classList.remove('hidden');
    if (window._toastTimeout) clearTimeout(window._toastTimeout as ReturnType<typeof setTimeout>);
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

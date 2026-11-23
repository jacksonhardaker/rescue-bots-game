// Web Audio Synthesizer for Transformers: Rescue Bots
import { gameSettings } from "../settings/settings.js";

class RescueSoundFX {
    ctx: AudioContext | null;
    enabled: boolean;
    loopsReady: boolean;
    masterBus: GainNode | null;
    compressor: DynamicsCompressorNode | null;
    sfxBus: GainNode | null;
    engineBus: GainNode | null;
    reverbConvolver: ConvolverNode | null;
    reverbWetGain: GainNode | null;
    noiseBuf: AudioBuffer | null;
    steamNoiseBuf: AudioBuffer | null;
    _lastTriggerTimes: Record<string, number>;
    _lastReverbArea: string;

    engineFilter!: BiquadFilterNode;
    engineOsc1!: OscillatorNode;
    engineOsc2!: OscillatorNode;
    engineSubGain!: GainNode;
    engineLfo!: OscillatorNode;
    engineLfoFilterGain!: GainNode;
    engineLfoPitchGain!: GainNode;
    engineGain!: GainNode;

    rotorNoiseSrc!: AudioBufferSourceNode;
    rotorBandpass!: BiquadFilterNode;
    rotorThumpOsc!: OscillatorNode;
    rotorThumpGain!: GainNode;
    rotorChopGain!: GainNode;
    rotorLfo!: OscillatorNode;
    rotorLfoAmpGain!: GainNode;
    rotorLfoFilterGain!: GainNode;
    rotorGain!: GainNode;

    sirenOsc!: OscillatorNode;
    sirenFilter!: BiquadFilterNode;
    sirenGain!: GainNode;

    constructor() {
                this.ctx = null;
                this.enabled = true;
                this.loopsReady = false;
                this.masterBus = null;
                this.compressor = null;
                this.sfxBus = null;
                this.engineBus = null;
                this.reverbConvolver = null;
                this.reverbWetGain = null;
                this.noiseBuf = null;
                this.steamNoiseBuf = null;
                this._lastTriggerTimes = {};
                this._lastReverbArea = '';
            }
            canTrigger(key: string, minGapMs = 35): boolean {
                const now = performance.now();
                const prev = this._lastTriggerTimes[key] || 0;
                if (now - prev < minGapMs) return false;
                this._lastTriggerTimes[key] = now;
                return true;
            }
            jitter(val: number, pct = 0.042): number {
                return val * (1 + (Math.random() * 2 - 1) * pct);
            }
            ensureReverbBuffer(): AudioBuffer | null {
                if (!this.ctx) return null;
                const sr = this.ctx.sampleRate;
                const len = Math.floor(sr * 1.15);
                const buf = this.ctx.createBuffer(2, len, sr);
                for (let ch = 0; ch < 2; ch++) {
                    const d = buf.getChannelData(ch);
                    for (let i = 0; i < len; i++) {
                        const t = i / sr;
                        const env = Math.exp(-t * 3.6) * (1 - 0.25 * Math.cos(t * 28));
                        d[i] = (Math.random() * 2 - 1) * env * 0.45;
                    }
                }
                return buf;
            }
            syncEnvironmentAcoustics() {
                if (!this.ctx || !this.reverbWetGain) return;
                const area = (typeof window !== 'undefined' && window.worldState?.activeArea) || 'SURFACE';
                if (area === this._lastReverbArea) return;
                this._lastReverbArea = area;
                const wet = area === 'UNDERGROUND'
                    ? 0.28
                    : (area === 'SPACE' || area === 'SOLAR_HUB' || area === 'SATURN_RING_RACE' || area === 'MOON' || area === 'PLANET_SURFACE'
                        ? 0.19
                        : 0.045);
                this.reverbWetGain.gain.setTargetAtTime(wet, this.ctx.currentTime, 0.08);
            }
            ensureNoiseBuffer() {
                if (!this.ctx) return null;
                if (!this.noiseBuf) {
                    const len = Math.floor(this.ctx.sampleRate * 0.5);
                    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                    const data = this.noiseBuf.getChannelData(0);
                    for (let i = 0; i < len; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                }
                return this.noiseBuf;
            }
            ensureSteamNoiseBuffer() {
                if (!this.ctx) return null;
                if (!this.steamNoiseBuf) {
                    const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
                    this.steamNoiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                    const data = this.steamNoiseBuf.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.28));
                    }
                }
                return this.steamNoiseBuf;
            }
            init() {
                if (!this.ctx) {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) this.ctx = new AudioCtx();
                }
                if (this.ctx && !this.masterBus) {
                    try {
                        this.masterBus = this.ctx.createGain();
                        this.sfxBus = this.ctx.createGain();
                        this.engineBus = this.ctx.createGain();

                        // 1. Master Dynamics Compressor / Limiter (prevents multi-SFX clipping on iPad speakers)
                        this.compressor = this.ctx.createDynamicsCompressor();
                        this.compressor.threshold.value = -14;
                        this.compressor.knee.value = 18;
                        this.compressor.ratio.value = 4.0;
                        this.compressor.attack.value = 0.003;
                        this.compressor.release.value = 0.18;

                        // 2. Procedural Environment Reverb Send (Cavern Echo & Space Shimmer)
                        const revBuf = this.ensureReverbBuffer();
                        if (revBuf) {
                            this.reverbConvolver = this.ctx.createConvolver();
                            this.reverbConvolver.buffer = revBuf;
                            this.reverbWetGain = this.ctx.createGain();
                            this.reverbWetGain.gain.value = 0.045;
                            this.sfxBus.connect(this.reverbConvolver);
                            this.reverbConvolver.connect(this.reverbWetGain);
                            this.reverbWetGain.connect(this.masterBus);
                        }

                        this.sfxBus.connect(this.masterBus);
                        this.engineBus.connect(this.masterBus);
                        this.masterBus.connect(this.compressor);
                        this.compressor.connect(this.ctx.destination);
                        this.applySettingsVolumes();
                    } catch (e) {
                        console.warn("Audio bus creation failed:", e);
                    }
                }
                if (this.ctx) {
                    this.ensureNoiseBuffer();
                    this.ensureSteamNoiseBuffer();
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            }
            applySettingsVolumes() {
                if (!this.ctx || !this.masterBus || !this.sfxBus || !this.engineBus) return;
                const aud = (typeof gameSettings !== "undefined" && gameSettings.audio)
                    ? gameSettings.audio
                    : { masterVolume: 1.0, sfxVolume: 1.0, engineVolume: 0.75, muted: false };
                const now = this.ctx.currentTime;
                const isMuted = aud.muted || !this.enabled;
                const m = isMuted ? 0 : Math.max(0, Math.min(1.0, aud.masterVolume));
                const s = Math.max(0, Math.min(1.0, aud.sfxVolume));
                const e = Math.max(0, Math.min(1.0, aud.engineVolume));
                this.masterBus.gain.setValueAtTime(m, now);
                this.sfxBus.gain.setValueAtTime(s, now);
                this.engineBus.gain.setValueAtTime(e, now);
            }
            getSfxDest(): AudioNode {
                this.init();
                this.syncEnvironmentAcoustics();
                return this.sfxBus || this.ctx!.destination;
            }
            getSpatialSfxDest(worldX?: number, worldZ?: number, maxDist = 260): AudioNode {
                const baseDest = this.getSfxDest();
                if (!this.ctx || worldX === undefined || worldZ === undefined || typeof window === 'undefined' || !window.player) {
                    return baseDest;
                }
                const px = window.player.pos.x;
                const pz = window.player.pos.z;
                const dx = worldX - px;
                const dz = worldZ - pz;
                const dist = Math.hypot(dx, dz);
                if (dist > maxDist) {
                    const muteGain = this.ctx.createGain();
                    muteGain.gain.value = 0.01;
                    muteGain.connect(baseDest);
                    return muteGain;
                }
                const atten = Math.max(0.08, 1 - (dist / maxDist) * 0.88);
                const heading = window.player.heading || 0;
                const rightX = Math.cos(heading);
                const rightZ = -Math.sin(heading);
                const pan = dist > 1 ? Math.max(-0.85, Math.min(0.85, ((dx * rightX + dz * rightZ) / dist) * 0.85)) : 0;

                const distGain = this.ctx.createGain();
                distGain.gain.value = atten;
                if (typeof this.ctx.createStereoPanner === 'function') {
                    const panner = this.ctx.createStereoPanner();
                    panner.pan.value = pan;
                    distGain.connect(panner);
                    panner.connect(baseDest);
                } else {
                    distGain.connect(baseDest);
                }
                return distGain;
            }
            getEngineDest(): AudioNode {
                this.init();
                return this.engineBus || this.ctx!.destination;
            }
            playSpeechPop(voicePitch = 1.0) {
                if (!this.enabled || !this.canTrigger('speechPop', 40)) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const p = Math.max(0.6, Math.min(1.5, voicePitch || 1.0));
                const dest = this.getSfxDest();
                // 3-note expressive Cybertronian syllable cadence scaled by each character's voicePitch!
                const pattern = [this.jitter(510 * p, 0.03), this.jitter(740 * p, 0.03), this.jitter(630 * p, 0.03)];
                pattern.forEach((f, idx) => {
                    const t0 = now + idx * 0.048;
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = idx === 1 ? 'triangle' : 'sine';
                    osc.frequency.setValueAtTime(f * 0.92, t0);
                    osc.frequency.exponentialRampToValueAtTime(f * 1.12, t0 + 0.044);
                    gain.gain.setValueAtTime(0.001, t0);
                    gain.gain.linearRampToValueAtTime(0.11, t0 + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.056);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(t0);
                    osc.stop(t0 + 0.06);
                });
            }
            playTransform(toVehicle: boolean) {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const ctx = this.ctx;
                const now = ctx.currentTime;

                // Reuse cached white-noise buffer for mechanical ratchet & air-hiss transients
                this.ensureNoiseBuffer();

                // Classic 5-pulse Transformers "Chu-ku-chu-ku-chee!" phased vocoder/flanger transformation sound
                // Analyzing the reference audio: 5 distinct 195ms mechanical syllables over ~1.14s with rising formant sweeps
                const steps = toVehicle
                    ? [
                        { t: 0.00, fStart: 175, fEnd: 330, formantStart: 1350, formantEnd: 1750, dur: 0.19 },
                        { t: 0.23, fStart: 195, fEnd: 370, formantStart: 1500, formantEnd: 1920, dur: 0.19 },
                        { t: 0.48, fStart: 225, fEnd: 430, formantStart: 1720, formantEnd: 2200, dur: 0.19 },
                        { t: 0.70, fStart: 265, fEnd: 510, formantStart: 1980, formantEnd: 2550, dur: 0.19 },
                        { t: 0.93, fStart: 310, fEnd: 640, formantStart: 2550, formantEnd: 3250, dur: 0.21 }
                    ]
                    : [
                        { t: 0.00, fStart: 310, fEnd: 560, formantStart: 2850, formantEnd: 2350, dur: 0.19 },
                        { t: 0.23, fStart: 265, fEnd: 470, formantStart: 2400, formantEnd: 1980, dur: 0.19 },
                        { t: 0.48, fStart: 225, fEnd: 395, formantStart: 2050, formantEnd: 1700, dur: 0.19 },
                        { t: 0.70, fStart: 195, fEnd: 340, formantStart: 1800, formantEnd: 1480, dur: 0.19 },
                        { t: 0.93, fStart: 165, fEnd: 280, formantStart: 1550, formantEnd: 1220, dur: 0.21 }
                    ];

                steps.forEach(s => {
                    const t0 = now + s.t;
                    const t1 = t0 + s.dur;

                    // Resonant metallic vocal-tract bandpass filter ("chu-ku-chee" formant)
                    const formantFilter = ctx.createBiquadFilter();
                    formantFilter.type = 'bandpass';
                    formantFilter.Q.setValueAtTime(3.2, t0);
                    formantFilter.frequency.setValueAtTime(s.formantStart, t0);
                    formantFilter.frequency.exponentialRampToValueAtTime(s.formantEnd, t1);

                    // Comb/flanger short delay line for unmistakable G1 hollow metallic phasing
                    const dryGain = ctx.createGain();
                    const wetDelay = ctx.createDelay(0.02);
                    const wetGain = ctx.createGain();
                    dryGain.gain.value = 0.75;
                    wetGain.gain.value = 0.55;
                    wetDelay.delayTime.setValueAtTime(0.0028, t0);
                    wetDelay.delayTime.linearRampToValueAtTime(0.0012, t1);

                    // Syllable amplitude envelope
                    const env = ctx.createGain();
                    env.gain.setValueAtTime(0.001, t0);
                    env.gain.linearRampToValueAtTime(0.26, t0 + 0.024);
                    env.gain.setValueAtTime(0.24, t1 - 0.045);
                    env.gain.exponentialRampToValueAtTime(0.001, t1);

                    formantFilter.connect(dryGain);
                    formantFilter.connect(wetDelay);
                    wetDelay.connect(wetGain);
                    dryGain.connect(env);
                    wetGain.connect(env);
                    env.connect(this.getSfxDest());

                    // 1. Dual detuned sawtooth/square oscillators with rapid 55Hz servo-ratchet pitch modulation
                    [1.0, 1.498].forEach((harm, hIdx) => {
                        const osc = ctx.createOscillator();
                        osc.type = hIdx === 0 ? 'sawtooth' : 'square';
                        osc.frequency.setValueAtTime(s.fStart * harm, t0);
                        osc.frequency.exponentialRampToValueAtTime(s.fEnd * harm, t1);

                        // Rapid ratchet vibrato LFO (gives the stuttering mechanical gear texture inside each syllable)
                        const lfo = ctx.createOscillator();
                        const lfoGain = ctx.createGain();
                        lfo.type = 'square';
                        lfo.frequency.value = 58;
                        lfoGain.gain.value = s.fStart * 0.18;
                        lfo.connect(lfoGain);
                        lfoGain.connect(osc.frequency);

                        const oscMix = ctx.createGain();
                        oscMix.gain.value = hIdx === 0 ? 0.65 : 0.38;
                        osc.connect(oscMix);
                        oscMix.connect(formantFilter);

                        osc.start(t0);
                        lfo.start(t0);
                        osc.stop(t1);
                        lfo.stop(t1);
                    });

                    // 2. Crisp mechanical air-ratchet noise burst ("ch-" consonant & pneumatic lock)
                    const noiseSrc = ctx.createBufferSource();
                    noiseSrc.buffer = this.noiseBuf;
                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.32, t0);
                    noiseGain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.08);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, t1);
                    noiseSrc.connect(noiseGain);
                    noiseGain.connect(formantFilter);
                    noiseSrc.start(t0);
                    noiseSrc.stop(t1);
                });
            }
            playDinoRoar(botType = 'BOULDER') {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const isPterosaur = botType === 'BLADES';
                const isRaptor = botType === 'BUMBLEBEE';
                const isGallimimus = botType === 'BLURR';
                const isTRex = botType === 'OPTIMUS';
                const isDilophosaur = botType === 'QUICKSHADOW';
                const isPlesiosaur = botType === 'HIGHTIDE';
                const isAnkylosaur = botType === 'SALVAGE';
                const isSpinosaurus = botType === 'STARSPEED';
                const baseFreq = isPterosaur ? 720 : (isGallimimus ? 560 : (isRaptor ? 420 : (isDilophosaur ? 380 : (isPlesiosaur ? 210 : (isSpinosaurus ? 152 : (isAnkylosaur ? 125 : (isTRex ? 82 : (botType === 'CHASE' ? 165 : 115))))))));
                const roarDuration = isTRex ? 0.65 : (isSpinosaurus ? 0.60 : (isPlesiosaur ? 0.58 : 0.48));
                [1.0, 1.35].forEach((mult, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = (isPterosaur || isRaptor || isGallimimus || isDilophosaur) ? 'triangle' : 'sawtooth';
                    const f0 = this.jitter(baseFreq * mult, 0.035);
                    osc.frequency.setValueAtTime(f0, now + idx * 0.04);
                    osc.frequency.exponentialRampToValueAtTime(f0 * (isPterosaur ? 1.45 : (isGallimimus ? 1.75 : (isRaptor ? 1.65 : (isDilophosaur ? 1.55 : (isSpinosaurus ? 1.48 : (isTRex ? 1.55 : (isPlesiosaur ? 1.35 : 0.68))))))), now + 0.22);
                    osc.frequency.exponentialRampToValueAtTime(f0 * (isPterosaur ? 0.55 : (isGallimimus ? 0.85 : (isRaptor ? 0.72 : (isSpinosaurus ? 0.48 : (isTRex ? 0.42 : 0.42))))), now + roarDuration - 0.04);
                    gain.gain.setValueAtTime(isTRex ? 0.18 : 0.13, now + idx * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + roarDuration);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + idx * 0.04);
                    osc.stop(now + roarDuration + 0.02);
                });
            }
            playBotSwitch() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [330, 440, 659.25].forEach((f, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + i * 0.06);
                    gain.gain.setValueAtTime(0.14, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.24);
                });
            }
            playSmash() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
                gain.gain.setValueAtTime(0.26, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.4);
            }
            playWaterSpray() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(340 + Math.random() * 180, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.16);
            }
            playSirenPulse() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(620, now);
                osc.frequency.linearRampToValueAtTime(920, now + 0.18);
                osc.frequency.linearRampToValueAtTime(580, now + 0.36);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.4);
            }
            playRockBreak(worldX?: number, worldZ?: number) {
                if (!this.enabled || !this.canTrigger('rockBreak', 35)) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const dest = this.getSpatialSfxDest(worldX, worldZ);
                [210, 145, 95].forEach((f, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(this.jitter(f, 0.055), now + i * 0.04);
                    osc.frequency.exponentialRampToValueAtTime(this.jitter(40, 0.05), now + i * 0.04 + 0.18);
                    gain.gain.setValueAtTime(0.12, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.2);
                    osc.connect(gain);
                    gain.connect(dest);
                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 0.21);
                });
            }
            playBeaconRestore() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(n, now + i * 0.085);
                    gain.gain.setValueAtTime(0.15, now + i * 0.085);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.085 + 0.35);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.085);
                    osc.stop(now + i * 0.085 + 0.36);
                });
            }
            playWaypointTap() {
                if (!this.enabled || !this.canTrigger('waypointTap', 40)) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [587.33, 880].forEach((n, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(this.jitter(n, 0.025), now + i * 0.055);
                    gain.gain.setValueAtTime(0.11, now + i * 0.055);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.055);
                    osc.stop(now + i * 0.055 + 0.17);
                });
            }
            playMapOpen() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [440, 659.25, 880].forEach((n, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(n, now + i * 0.04);
                    gain.gain.setValueAtTime(0.12, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.18);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 0.19);
                });
            }
            playMapClose() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [880, 587.33].forEach((n, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(n, now + i * 0.04);
                    gain.gain.setValueAtTime(0.10, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.14);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 0.15);
                });
            }
            playEnergonCollect() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [659.25, 880, 1174.66, 1567.98].forEach((n, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(n, now + i * 0.045);
                    gain.gain.setValueAtTime(0.14, now + i * 0.045);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.24);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.045);
                    osc.stop(now + i * 0.045 + 0.25);
                });
            }
            playRankUp() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((n, i) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = i % 2 === 0 ? 'triangle' : 'sine';
                    osc.frequency.setValueAtTime(n, now + i * 0.075);
                    gain.gain.setValueAtTime(0.18, now + i * 0.075);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.48);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + i * 0.075);
                    osc.stop(now + i * 0.075 + 0.5);
                });
            }
            playLevelUp() {
                this.playRankUp();
            }
            playSoapSuds() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                for (let i = 0; i < 3; i++) {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = now + i * 0.04;
                    osc.type = 'sine';
                    const startFreq = 480 + Math.random() * 380;
                    osc.frequency.setValueAtTime(startFreq, t);
                    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, t + 0.055);
                    gain.gain.setValueAtTime(0.09, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(t);
                    osc.stop(t + 0.07);
                }
            }
            playStuntChime() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    const t = now + idx * 0.05;
                    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(t);
                    osc.stop(t + 0.4);
                });
            }
            playThunderRumble() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(28, now + 1.4);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(150, now);
                filter.frequency.exponentialRampToValueAtTime(55, now + 1.4);

                gain.gain.setValueAtTime(0.24, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.getSfxDest());

                osc.start(now);
                osc.stop(now + 1.55);
            }
            playVolcanoRumble() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(45, now);
                osc.frequency.linearRampToValueAtTime(55, now + 0.6);
                osc.frequency.linearRampToValueAtTime(35, now + 1.2);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 1.3);
            }
            playFoghorn() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(68, now);
                osc.frequency.linearRampToValueAtTime(58, now + 2.2);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(240, now);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.24, now + 0.35);
                gain.gain.setValueAtTime(0.22, now + 1.8);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.getSfxDest());

                osc.start(now);
                osc.stop(now + 2.45);
            }
            playSteamHiss() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.ensureSteamNoiseBuffer();

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2600, now);
                filter.frequency.exponentialRampToValueAtTime(800, now + 0.7);
                filter.Q.value = 1.4;

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.26, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.getSfxDest());
                noise.start(now);
            }
            playLightningStrike() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.2);
                setTimeout(() => this.playThunderRumble(), 70);
            }
            playTireSqueal() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(680, now);
                osc.frequency.linearRampToValueAtTime(740, now + 0.12);
                osc.frequency.linearRampToValueAtTime(620, now + 0.28);
                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.34);
            }
            playConeKnock() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.15);
            }
            playRelicFound() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // High sparkling ascending golden arpeggio (C6, E6, G6, C7)
                [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + idx * 0.09);
                    osc.stop(now + idx * 0.09 + 0.6);
                });
            }
            playDiscoveryChime() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Celebratory resonant brass/fanfare chime
                [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.18, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.7);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.75);
                });
            }
            playDinerDing() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Bright high service bell ding (fundamental 1568Hz + overtone 3136Hz)
                [1567.98, 3135.96].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(idx === 0 ? 0.22 : 0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 0.9);
                });
            }
            playEnergyCharge() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Dual ascending sci-fi harmonic charge
                [140, 210, 280].forEach((baseFreq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    const filter = this.ctx!.createBiquadFilter();
                    osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
                    osc.frequency.setValueAtTime(baseFreq, now);
                    osc.frequency.exponentialRampToValueAtTime(baseFreq * 4.5, now + 0.65);
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(450, now);
                    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.65);
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(0.16, now + 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 0.72);
                });
            }
            playWarpWhoosh() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Deep resonant space-warp phasing swoosh
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(62, now + 0.85);
                filter.type = 'bandpass';
                filter.Q.setValueAtTime(3.8, now);
                filter.frequency.setValueAtTime(1400, now);
                filter.frequency.exponentialRampToValueAtTime(180, now + 0.85);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.32, now + 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.92);
            }
            playCatapultCountdown() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                [587.33, 659.25, 880.00].forEach((freq, idx) => {
                    const t = now + idx * 0.16;
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.12, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(t);
                    osc.stop(t + 0.13);
                });
            }
            playCatapultBlast() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Heavy sub-bass launch boom + rocket whoosh
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(32, now + 0.9);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 1.0);

                const oscHi = this.ctx.createOscillator();
                const gainHi = this.ctx.createGain();
                oscHi.type = 'sawtooth';
                oscHi.frequency.setValueAtTime(180, now);
                oscHi.frequency.exponentialRampToValueAtTime(720, now + 0.4);
                gainHi.gain.setValueAtTime(0.2, now);
                gainHi.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                oscHi.connect(gainHi);
                gainHi.connect(this.getSfxDest());
                oscHi.start(now);
                oscHi.stop(now + 0.6);
            }
            playShipHorn() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Deep resonant dual-tone marine foghorn / ferry horn (110Hz A2 + 146.83Hz D3)
                [110.0, 146.83, 220.0].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = idx === 2 ? 'sawtooth' : 'triangle';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(idx === 2 ? 0.08 : 0.22, now + 0.12);
                    gain.gain.setValueAtTime(idx === 2 ? 0.08 : 0.22, now + 1.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 1.5);
                });
            }
            playCarHonk(pitch = 1.0) {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Dual-tone cheerful civilian car horn (F4 349.23Hz + A4 440Hz)
                const freqs = [349.23 * pitch, 440.0 * pitch];
                freqs.forEach(freq => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
                    gain.gain.setValueAtTime(0.07, now + 0.14);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 0.22);
                });
            }
            playTrainWhistle() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Iconic 5-chime American diesel/steam locomotive horn chord (Eb4, F#4, G#4, B4, Eb5)
                const freqs = [311.13, 369.99, 415.30, 493.88, 622.25];
                freqs.forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
                    osc.frequency.setValueAtTime(freq, now);
                    // Slight pitch wobble for rich locomotive acoustic chime
                    osc.frequency.linearRampToValueAtTime(freq * 1.008, now + 0.4);
                    osc.frequency.linearRampToValueAtTime(freq * 0.996, now + 0.9);
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(0.065, now + 0.08);
                    gain.gain.setValueAtTime(0.065, now + 0.85);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 1.3);
                });
            }
            playCrossingBell() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Clean resonant metallic railroad crossing bell ding (A5 880Hz + 1760Hz harmonic)
                [880.0, 1760.0].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = idx === 0 ? 'triangle' : 'sine';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(idx === 0 ? 0.08 : 0.03, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 0.25);
                });
            }
            playTrainChug() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Low steam chug & rhythmic rail click-clack
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(68, now);
                osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.16);
            }
            playDockClank() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Heavy metallic clank
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(85, now);
                osc.frequency.exponentialRampToValueAtTime(28, now + 0.25);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.38);
            }
            playMagnetZap() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Deep 60Hz magnetic buzz + arcing hum
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, now);
                osc.frequency.linearRampToValueAtTime(120, now + 0.5);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.7);
            }
            playBoingSound() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Cartoon trampoline boing (upward pitch chirp + vibrato)
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(760, now + 0.28);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.58);
            }
            playTargetSplat() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Target bell chime + wet paint pop
                [1318.51, 1567.98].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now);
                    osc.stop(now + 0.5);
                });
            }
            playBabyDinoRoar() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Friendly synthesized cartoon baby dinosaur rumble + pitch-bend growl
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(95, now);
                osc.frequency.linearRampToValueAtTime(145, now + 0.18);
                osc.frequency.exponentialRampToValueAtTime(65, now + 0.65);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                osc.connect(gain);
                gain.connect(this.getSfxDest());
                osc.start(now);
                osc.stop(now + 0.72);
            }
            playCarnivalChime() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                // Melodic cheerful music-box arpeggio for Ferris wheel & carnival boardwalk
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                    const osc = this.ctx!.createOscillator();
                    const gain = this.ctx!.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                    gain.gain.setValueAtTime(0.001, now + idx * 0.09);
                    gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.09 + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.38);
                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(now + idx * 0.09);
                    osc.stop(now + idx * 0.09 + 0.42);
                });
            }
            ensureContinuousLoops() {
                if (this.loopsReady || !this.ctx || this.ctx.state !== 'running') return;
                const ctx = this.ctx;
                this.loopsReady = true;

                // 1. Continuous Ground Engine Synth (Boulder Diesel Rumble, Heatwave Fire V8 Purr, Chase Cruiser Hum)
                this.engineGain = ctx.createGain();
                this.engineGain.gain.value = 0.0001;
                this.engineFilter = ctx.createBiquadFilter();
                this.engineFilter.type = 'lowpass';
                this.engineFilter.frequency.value = 180;
                this.engineFilter.Q.value = 2.4;

                this.engineOsc1 = ctx.createOscillator();
                this.engineOsc1.type = 'sawtooth';
                this.engineOsc1.frequency.value = 50;

                this.engineOsc2 = ctx.createOscillator();
                this.engineOsc2.type = 'triangle';
                this.engineOsc2.frequency.value = 75;
                this.engineSubGain = ctx.createGain();
                this.engineSubGain.gain.value = 0.55;

                // Cylinder chug LFO (modulates filter cutoff & primary pitch for rhythmic diesel/V8 purr)
                this.engineLfo = ctx.createOscillator();
                this.engineLfo.type = 'sine';
                this.engineLfo.frequency.value = 12;
                this.engineLfoFilterGain = ctx.createGain();
                this.engineLfoFilterGain.gain.value = 45;
                this.engineLfoPitchGain = ctx.createGain();
                this.engineLfoPitchGain.gain.value = 3.2;

                this.engineLfo.connect(this.engineLfoFilterGain);
                this.engineLfoFilterGain.connect(this.engineFilter.frequency);
                this.engineLfo.connect(this.engineLfoPitchGain);
                this.engineLfoPitchGain.connect(this.engineOsc1.frequency);

                this.engineOsc1.connect(this.engineFilter);
                this.engineOsc2.connect(this.engineSubGain);
                this.engineSubGain.connect(this.engineFilter);
                this.engineFilter.connect(this.engineGain);
                this.engineGain.connect(this.getEngineDest());

                this.engineOsc1.start();
                this.engineOsc2.start();
                this.engineLfo.start();

                // 2. Blades Helicopter Rhythmic "Whup-Whup-Whup" Rotor Chop Loop
                const noiseLen = ctx.sampleRate * 2.0;
                const rotorBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
                const rData = rotorBuf.getChannelData(0);
                let lastOut = 0.0;
                for (let i = 0; i < noiseLen; i++) {
                    const white = Math.random() * 2 - 1;
                    // Warm pink-tinted noise so rotor blades sound deep & airy rather than hissy
                    lastOut = (lastOut + (0.08 * white)) / 1.08;
                    rData[i] = lastOut * 3.2;
                }
                this.rotorNoiseSrc = ctx.createBufferSource();
                this.rotorNoiseSrc.buffer = rotorBuf;
                this.rotorNoiseSrc.loop = true;

                this.rotorBandpass = ctx.createBiquadFilter();
                this.rotorBandpass.type = 'bandpass';
                this.rotorBandpass.frequency.value = 210;
                this.rotorBandpass.Q.value = 2.2;

                this.rotorThumpOsc = ctx.createOscillator();
                this.rotorThumpOsc.type = 'triangle';
                this.rotorThumpOsc.frequency.value = 48;
                this.rotorThumpGain = ctx.createGain();
                this.rotorThumpGain.gain.value = 0.45;

                // Blade-pass rhythmic modulator ("whup-whup-whup" at 8Hz–12Hz)
                this.rotorChopGain = ctx.createGain();
                this.rotorChopGain.gain.value = 0.55;
                this.rotorLfo = ctx.createOscillator();
                this.rotorLfo.type = 'sine';
                this.rotorLfo.frequency.value = 8.4;
                this.rotorLfoAmpGain = ctx.createGain();
                this.rotorLfoAmpGain.gain.value = 0.45;
                this.rotorLfoFilterGain = ctx.createGain();
                this.rotorLfoFilterGain.gain.value = 75;

                this.rotorLfo.connect(this.rotorLfoAmpGain);
                this.rotorLfoAmpGain.connect(this.rotorChopGain.gain);
                this.rotorLfo.connect(this.rotorLfoFilterGain);
                this.rotorLfoFilterGain.connect(this.rotorBandpass.frequency);

                this.rotorGain = ctx.createGain();
                this.rotorGain.gain.value = 0.0001;

                this.rotorNoiseSrc.connect(this.rotorBandpass);
                this.rotorBandpass.connect(this.rotorChopGain);
                this.rotorThumpOsc.connect(this.rotorThumpGain);
                this.rotorThumpGain.connect(this.rotorChopGain);
                this.rotorChopGain.connect(this.rotorGain);
                this.rotorGain.connect(this.getEngineDest());

                this.rotorNoiseSrc.start();
                this.rotorThumpOsc.start();
                this.rotorLfo.start();

                // 3. Optional Emergency Siren Loop (Heatwave Fire Wail & Chase Police Cruiser Yelp)
                this.sirenOsc = ctx.createOscillator();
                this.sirenOsc.type = 'triangle';
                this.sirenOsc.frequency.value = 640;

                this.sirenFilter = ctx.createBiquadFilter();
                this.sirenFilter.type = 'lowpass';
                this.sirenFilter.frequency.value = 1450;

                this.sirenGain = ctx.createGain();
                this.sirenGain.gain.value = 0.0001;

                this.sirenOsc.connect(this.sirenFilter);
                this.sirenFilter.connect(this.sirenGain);
                this.sirenGain.connect(this.getSfxDest());
                this.sirenOsc.start();
            }
            stopContinuousLoops() {
                if (!this.loopsReady || !this.ctx) return;
                const t = this.ctx.currentTime;
                this.engineGain.gain.setTargetAtTime(0.0001, t, 0.05);
                this.rotorGain.gain.setTargetAtTime(0.0001, t, 0.05);
                this.sirenGain.gain.setTargetAtTime(0.0001, t, 0.05);
            }
            updateContinuousLoops(botType: string, mode: string, speed: number, sirenActive: boolean, boostTimer: number, nowMs: number) {
                if (!this.enabled || !this.ctx || this.ctx.state !== 'running') {
                    this.stopContinuousLoops();
                    return;
                }
                this.ensureContinuousLoops();
                if (!this.loopsReady) return;

                const t = this.ctx.currentTime;
                this.syncEnvironmentAcoustics();
                const absSpeed = Math.abs(speed);
                const speedNorm = Math.min(1.0, absSpeed / 65.0);

                // 0. Starship Sigma Zero-G Space Ion Thruster Hum
                if (mode === 'SPACE') {
                    this.rotorGain.gain.setTargetAtTime(0.0001, t, 0.08);
                    this.sirenGain.gain.setTargetAtTime(0.0001, t, 0.06);
                    const isBoost = boostTimer > 0;
                    const thrusterVol = 0.012 + speedNorm * 0.026 + (isBoost ? 0.018 : 0);
                    this.engineGain.gain.setTargetAtTime(thrusterVol, t, 0.08);
                    const baseFreq = 58 + speedNorm * 68 + (isBoost ? 42 : 0);
                    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.07);
                    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.07);
                    this.engineFilter.frequency.setTargetAtTime(220 + speedNorm * 380 + (isBoost ? 240 : 0), t, 0.07);
                    this.engineLfo.frequency.setTargetAtTime(6.0 + speedNorm * 14.0, t, 0.07);
                    this.engineLfoFilterGain.gain.setTargetAtTime(48 + speedNorm * 40, t, 0.07);
                    this.engineLfoPitchGain.gain.setTargetAtTime(1.8 + speedNorm * 1.8, t, 0.07);
                    return;
                }

                // A. Ground Vehicle Engine vs Aircraft Flight vs Helicopter Rotor Chop
                const isBladesAir = botType === 'BLADES' && (mode === 'VEHICLE' || mode === 'DINO');
                const isQuickshadowAir = botType === 'QUICKSHADOW' && mode === 'VEHICLE' && (typeof window !== 'undefined' && typeof window.isBotDocked === 'function' && window.isBotDocked('QUICKSHADOW'));
                const isHiddenJetAir = mode === 'HIDDEN_VEHICLE';
                const isGroundVehicle = !isBladesAir && !isQuickshadowAir && !isHiddenJetAir && mode === 'VEHICLE';

                if (isHiddenJetAir) {
                    // VTOL Hover Fighter Jet: Sleek twin turbine hum + downward lift-fan whoosh!
                    const isBoost = boostTimer > 0;
                    const jetVol = 0.016 + speedNorm * 0.026 + (isBoost ? 0.016 : 0);
                    this.engineGain.gain.setTargetAtTime(jetVol, t, 0.08);
                    const baseFreq = 92 + speedNorm * 105 + (isBoost ? 55 : 0);
                    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.06);
                    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.06);
                    this.engineFilter.frequency.setTargetAtTime(360 + speedNorm * 520 + (isBoost ? 280 : 0), t, 0.06);
                    this.engineLfo.frequency.setTargetAtTime(14.0 + speedNorm * 16.0, t, 0.06);
                    this.engineLfoFilterGain.gain.setTargetAtTime(42 + speedNorm * 35, t, 0.06);
                    this.engineLfoPitchGain.gain.setTargetAtTime(1.4 + speedNorm * 1.6, t, 0.06);
                    this.rotorGain.gain.setTargetAtTime(0.014 + speedNorm * 0.01, t, 0.08);
                    this.rotorLfo.frequency.setTargetAtTime(16.0 + speedNorm * 8.0, t, 0.08);
                } else if (isGroundVehicle) {
                    // Gentle speed-reactive engine volume (soft idle purr when parked in Vehicle mode, richer purr when driving)
                    const targetEngineVol = 0.015 + speedNorm * 0.032 + (boostTimer > 0 ? 0.012 : 0);
                    this.engineGain.gain.setTargetAtTime(targetEngineVol, t, 0.08);
                    this.rotorGain.gain.setTargetAtTime(0.0001, t, 0.08);

                    if (botType === 'BOULDER' || botType === 'SALVAGE' || botType === 'OPTIMUS') {
                        // Heavy Bulldozer / Compactor / Semi Cab Turbo-Diesel Rumble
                        const baseFreq = (botType === 'OPTIMUS' ? 46 : 42) + speedNorm * 44;
                        this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.07);
                        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.07);
                        this.engineFilter.frequency.setTargetAtTime(135 + speedNorm * 225, t, 0.07);
                        this.engineLfo.frequency.setTargetAtTime(9.5 + speedNorm * 15.5, t, 0.07);
                        this.engineLfoFilterGain.gain.setTargetAtTime(55 + speedNorm * 45, t, 0.07);
                        this.engineLfoPitchGain.gain.setTargetAtTime(3.8 + speedNorm * 2.5, t, 0.07);
                    } else if (botType === 'STARSPEED') {
                        // Starspeed Motocross Dirt Bike: Punchy High-Revving 2-Stroke Braaap!
                        const baseFreq = 84 + speedNorm * 118 + (boostTimer > 0 ? 35 : 0);
                        this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.06);
                        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.0, t, 0.06);
                        this.engineFilter.frequency.setTargetAtTime(310 + speedNorm * 540, t, 0.06);
                        this.engineLfo.frequency.setTargetAtTime(22.0 + speedNorm * 32.0, t, 0.06);
                        this.engineLfoFilterGain.gain.setTargetAtTime(65 + speedNorm * 55, t, 0.06);
                        this.engineLfoPitchGain.gain.setTargetAtTime(4.2 + speedNorm * 3.2, t, 0.06);
                    } else if (botType === 'HEATWAVE') {
                        // Fire Engine V8 Purr (Warm mid-bass purr)
                        const baseFreq = 52 + speedNorm * 56;
                        this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.07);
                        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.498, t, 0.07);
                        this.engineFilter.frequency.setTargetAtTime(175 + speedNorm * 280, t, 0.07);
                        this.engineLfo.frequency.setTargetAtTime(13.5 + speedNorm * 19.0, t, 0.07);
                        this.engineLfoFilterGain.gain.setTargetAtTime(42 + speedNorm * 38, t, 0.07);
                        this.engineLfoPitchGain.gain.setTargetAtTime(2.4 + speedNorm * 2.0, t, 0.07);
                    } else {
                        // CHASE / BUMBLEBEE / BLURR / QUICKSHADOW: High-Revving Cruiser & Supercar Turbine Hum
                        const baseFreq = (botType === 'BLURR' ? 76 : 64) + speedNorm * 92;
                        this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.07);
                        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.07);
                        this.engineFilter.frequency.setTargetAtTime(210 + speedNorm * 380, t, 0.07);
                        this.engineLfo.frequency.setTargetAtTime(18.0 + speedNorm * 26.0, t, 0.07);
                        this.engineLfoFilterGain.gain.setTargetAtTime(32 + speedNorm * 30, t, 0.07);
                        this.engineLfoPitchGain.gain.setTargetAtTime(1.6 + speedNorm * 1.5, t, 0.07);
                    }
                } else if (isBladesAir) {
                    // Blades Helicopter / Pterosaur Rhythmic "Whup-Whup-Whup" Rotor Loop
                    this.engineGain.gain.setTargetAtTime(0.0001, t, 0.08);
                    const isCopter = mode === 'VEHICLE';
                    const targetRotorVol = isCopter ? (0.026 + speedNorm * 0.028) : (0.014 + speedNorm * 0.020);
                    this.rotorGain.gain.setTargetAtTime(targetRotorVol, t, 0.08);

                    const bladePassHz = isCopter ? (7.8 + speedNorm * 4.4) : (4.5 + speedNorm * 3.5);
                    this.rotorLfo.frequency.setTargetAtTime(bladePassHz, t, 0.07);
                    this.rotorBandpass.frequency.setTargetAtTime(190 + speedNorm * 115, t, 0.07);
                    this.rotorThumpOsc.frequency.setTargetAtTime(45 + speedNorm * 20, t, 0.07);
                } else if (isQuickshadowAir) {
                    // Quickshadow Stealth Bomber Supersonic Jet Turbine Loop
                    this.rotorGain.gain.setTargetAtTime(0.0001, t, 0.08);
                    const targetJetVol = 0.022 + speedNorm * 0.038;
                    this.engineGain.gain.setTargetAtTime(targetJetVol, t, 0.08);
                    const baseFreq = 95 + speedNorm * 110;
                    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.07);
                    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.0, t, 0.07);
                    this.engineFilter.frequency.setTargetAtTime(380 + speedNorm * 520, t, 0.07);
                    this.engineLfo.frequency.setTargetAtTime(4.0 + speedNorm * 8.0, t, 0.07);
                    this.engineLfoFilterGain.gain.setTargetAtTime(65 + speedNorm * 45, t, 0.07);
                    this.engineLfoPitchGain.gain.setTargetAtTime(2.2 + speedNorm * 2.0, t, 0.07);
                } else {
                    // Quiet when walking in Bot or ground Dino mode
                    this.engineGain.gain.setTargetAtTime(0.0001, t, 0.08);
                    this.rotorGain.gain.setTargetAtTime(0.0001, t, 0.08);
                }

                // B. Optional Siren Loop for Heatwave & Chase (Active when Siren Toggle is ON or during Emergency Boost in Vehicle Mode)
                const canSiren = (botType === 'HEATWAVE' || botType === 'CHASE');
                const shouldPlaySiren = canSiren && (sirenActive || (boostTimer > 0 && mode === 'VEHICLE'));

                if (shouldPlaySiren) {
                    const nowSec = nowMs * 0.001;
                    let sirenFreq = 680;
                    if (botType === 'HEATWAVE') {
                        // Classic Fire Engine Rising & Falling Wail (520Hz <-> 870Hz)
                        const wailWave = 0.5 + 0.5 * Math.sin(nowSec * Math.PI * 1.35);
                        sirenFreq = 520 + wailWave * 350;
                    } else {
                        // Chase Police Cruiser Urgent Yelp / Two-Tone Sweep (630Hz <-> 960Hz)
                        const yelpWave = 0.5 + 0.5 * Math.sin(nowSec * Math.PI * 3.4);
                        sirenFreq = 630 + yelpWave * 330;
                    }
                    this.sirenOsc.frequency.setTargetAtTime(sirenFreq, t, 0.03);
                    this.sirenGain.gain.setTargetAtTime(0.032, t, 0.06);
                } else {
                    this.sirenGain.gain.setTargetAtTime(0.0001, t, 0.06);
                }
            }

            // Dr. Morocco & MorBot Villain SFX
            playMorbotAlert() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const t = this.ctx.currentTime;
                    // Ominous villain fanfare: minor triad pulse (D4 -> F4 -> Ab4 -> D5)
                    const notes = [293.66, 349.23, 415.30, 587.33];
                    notes.forEach((freq, idx) => {
                        const osc = this.ctx!.createOscillator();
                        const gain = this.ctx!.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, t + idx * 0.16);
                        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + idx * 0.16 + 0.35);

                        const filter = this.ctx!.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(1400, t + idx * 0.16);

                        gain.gain.setValueAtTime(0.001, t + idx * 0.16);
                        gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.16 + 0.04);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.16 + 0.45);

                        osc.connect(filter);
                        filter.connect(gain);
                        gain.connect(this.getSfxDest());
                        osc.start(t + idx * 0.16);
                        osc.stop(t + idx * 0.16 + 0.48);
                    });
                } catch (e) {
                    console.warn("SFX playMorbotAlert error:", e);
                }
            }

            playMorbotHit() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const t = this.ctx.currentTime;
                    // Metallic crunch + electric spark discharge
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(280, t);
                    osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);

                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

                    osc.connect(gain);
                    gain.connect(this.getSfxDest());
                    osc.start(t);
                    osc.stop(t + 0.26);

                    // High spark fizzle
                    const sparkOsc = this.ctx.createOscillator();
                    const sparkGain = this.ctx.createGain();
                    sparkOsc.type = 'sawtooth';
                    sparkOsc.frequency.setValueAtTime(980, t);
                    sparkOsc.frequency.linearRampToValueAtTime(180, t + 0.35);
                    sparkGain.gain.setValueAtTime(0.06, t);
                    sparkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    sparkOsc.connect(sparkGain);
                    sparkGain.connect(this.getSfxDest());
                    sparkOsc.start(t);
                    sparkOsc.stop(t + 0.36);
                } catch (e) {
                    console.warn("SFX playMorbotHit error:", e);
                }
            }

            playMorbotDefeat() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const t = this.ctx.currentTime;
                    // Escalating victory brass fanfare
                    const fanNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
                    fanNotes.forEach((f, idx) => {
                        const osc = this.ctx!.createOscillator();
                        const gain = this.ctx!.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(f, t + idx * 0.12);

                        gain.gain.setValueAtTime(0.001, t + idx * 0.12);
                        gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.12 + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + (idx === fanNotes.length - 1 ? 0.95 : 0.3));

                        osc.connect(gain);
                        gain.connect(this.getSfxDest());
                        osc.start(t + idx * 0.12);
                        osc.stop(t + idx * 0.12 + 1.0);
                    });
                } catch (e) {
                    console.warn("SFX playMorbotDefeat error:", e);
                }
            }

            // Blades Helicopter & Pterosaur Altitude SFX
            playFlightAscend() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const ctx = this.ctx;
                    const now = ctx.currentTime;

                    // 1. Helicopter Turbine Spool-Up Whine (glides up from 240Hz to 520Hz)
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(240, now);
                    osc.frequency.exponentialRampToValueAtTime(520, now + 0.28);

                    // Rotor blade chop modulation LFO (rapid 22Hz chopper flutter)
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.type = 'triangle';
                    lfo.frequency.setValueAtTime(22, now);
                    lfoGain.gain.setValueAtTime(32, now);
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);

                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
                    gain.gain.setValueAtTime(0.12, now + 0.20);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

                    osc.connect(gain);
                    gain.connect(this.getSfxDest());

                    osc.start(now);
                    lfo.start(now);
                    osc.stop(now + 0.33);
                    lfo.stop(now + 0.33);

                    // 2. Rotor Blade Downdraft Air Whoosh (filtered noise sweep upward)
                    const noiseSrc = ctx.createBufferSource();
                    noiseSrc.buffer = this.ensureNoiseBuffer();
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.Q.setValueAtTime(2.2, now);
                    filter.frequency.setValueAtTime(550, now);
                    filter.frequency.exponentialRampToValueAtTime(1450, now + 0.26);

                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.001, now);
                    noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

                    noiseSrc.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(this.getSfxDest());
                    noiseSrc.start(now);
                    noiseSrc.stop(now + 0.31);

                    // 3. Low-end blade thump (triangle pulse rising from 95Hz to 160Hz)
                    const thumpOsc = ctx.createOscillator();
                    const thumpGain = ctx.createGain();
                    thumpOsc.type = 'triangle';
                    thumpOsc.frequency.setValueAtTime(95, now);
                    thumpOsc.frequency.linearRampToValueAtTime(160, now + 0.22);
                    thumpGain.gain.setValueAtTime(0.15, now);
                    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    thumpOsc.connect(thumpGain);
                    thumpGain.connect(this.getSfxDest());
                    thumpOsc.start(now);
                    thumpOsc.stop(now + 0.26);
                } catch (e) {
                    console.warn("SFX playFlightAscend error:", e);
                }
            }

            playFlightDescend() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const ctx = this.ctx;
                    const now = ctx.currentTime;

                    // 1. Helicopter Turbine Spin-Down (glides smoothly down from 480Hz to 210Hz)
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(480, now);
                    osc.frequency.exponentialRampToValueAtTime(210, now + 0.28);

                    // Rotor blade chop modulation LFO (gentler 18Hz chopper flutter)
                    const lfo = ctx.createOscillator();
                    const lfoGain = ctx.createGain();
                    lfo.type = 'triangle';
                    lfo.frequency.setValueAtTime(18, now);
                    lfoGain.gain.setValueAtTime(26, now);
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.frequency);

                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.linearRampToValueAtTime(0.13, now + 0.04);
                    gain.gain.setValueAtTime(0.11, now + 0.18);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

                    osc.connect(gain);
                    gain.connect(this.getSfxDest());

                    osc.start(now);
                    lfo.start(now);
                    osc.stop(now + 0.33);
                    lfo.stop(now + 0.33);

                    // 2. Air Wash / Descent Downward Wind Settle (bandpass filter sweep downward)
                    const noiseSrc = ctx.createBufferSource();
                    noiseSrc.buffer = this.ensureNoiseBuffer();
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.Q.setValueAtTime(2.0, now);
                    filter.frequency.setValueAtTime(1300, now);
                    filter.frequency.exponentialRampToValueAtTime(480, now + 0.26);

                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.001, now);
                    noiseGain.gain.linearRampToValueAtTime(0.16, now + 0.04);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);

                    noiseSrc.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(this.getSfxDest());
                    noiseSrc.start(now);
                    noiseSrc.stop(now + 0.30);

                    // 3. Settling low-end tone (glides down from 150Hz to 75Hz)
                    const thumpOsc = ctx.createOscillator();
                    const thumpGain = ctx.createGain();
                    thumpOsc.type = 'triangle';
                    thumpOsc.frequency.setValueAtTime(150, now);
                    thumpOsc.frequency.linearRampToValueAtTime(75, now + 0.24);
                    thumpGain.gain.setValueAtTime(0.13, now);
                    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
                    thumpOsc.connect(thumpGain);
                    thumpGain.connect(this.getSfxDest());
                    thumpOsc.start(now);
                    thumpOsc.stop(now + 0.27);
                } catch (e) {
                    console.warn("SFX playFlightDescend error:", e);
                }
            }

            playDrillBore() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const ctx = this.ctx;
                    const now = ctx.currentTime;

                    // 1. Deep sawtooth industrial auger motor ramping up & chewing earth
                    const motorOsc = ctx.createOscillator();
                    const motorGain = ctx.createGain();
                    motorOsc.type = 'sawtooth';
                    motorOsc.frequency.setValueAtTime(58, now);
                    motorOsc.frequency.exponentialRampToValueAtTime(118, now + 0.35);
                    motorOsc.frequency.linearRampToValueAtTime(86, now + 1.35);

                    const motorFilter = ctx.createBiquadFilter();
                    motorFilter.type = 'lowpass';
                    motorFilter.frequency.setValueAtTime(420, now);
                    motorFilter.frequency.linearRampToValueAtTime(920, now + 0.45);
                    motorFilter.frequency.exponentialRampToValueAtTime(260, now + 1.4);

                    motorGain.gain.setValueAtTime(0.001, now);
                    motorGain.gain.linearRampToValueAtTime(0.22, now + 0.08);
                    motorGain.gain.setValueAtTime(0.20, now + 0.95);
                    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 1.42);

                    motorOsc.connect(motorFilter);
                    motorFilter.connect(motorGain);
                    motorGain.connect(this.getSfxDest());
                    motorOsc.start(now);
                    motorOsc.stop(now + 1.44);

                    // 2. Bandpass-filtered rock grinding noise (reuses cached noise buffer, looped for 1.35s)
                    const noiseSrc = ctx.createBufferSource();
                    noiseSrc.buffer = this.ensureNoiseBuffer();
                    noiseSrc.loop = true;
                    const grindFilter = ctx.createBiquadFilter();
                    grindFilter.type = 'bandpass';
                    grindFilter.Q.setValueAtTime(1.8, now);
                    grindFilter.frequency.setValueAtTime(360, now);
                    grindFilter.frequency.exponentialRampToValueAtTime(1150, now + 0.45);
                    grindFilter.frequency.exponentialRampToValueAtTime(280, now + 1.38);

                    const grindGain = ctx.createGain();
                    grindGain.gain.setValueAtTime(0.001, now);
                    grindGain.gain.linearRampToValueAtTime(0.22, now + 0.10);
                    grindGain.gain.setValueAtTime(0.19, now + 0.90);
                    grindGain.gain.exponentialRampToValueAtTime(0.001, now + 1.40);

                    noiseSrc.connect(grindFilter);
                    grindFilter.connect(grindGain);
                    grindGain.connect(this.getSfxDest());
                    noiseSrc.start(now);
                    noiseSrc.stop(now + 1.42);
                } catch (e) {
                    console.warn("SFX playDrillBore error:", e);
                }
            }

            playRockCrack() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const ctx = this.ctx;
                    const now = ctx.currentTime;

                    // 1. Seismic thump
                    const thump = ctx.createOscillator();
                    const thumpGain = ctx.createGain();
                    thump.type = 'triangle';
                    thump.frequency.setValueAtTime(135, now);
                    thump.frequency.exponentialRampToValueAtTime(28, now + 0.36);
                    thumpGain.gain.setValueAtTime(0.28, now);
                    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
                    thump.connect(thumpGain);
                    thumpGain.connect(this.getSfxDest());
                    thump.start(now);
                    thump.stop(now + 0.40);

                    // 2. Crisp rock shatter noise burst
                    const crackSrc = ctx.createBufferSource();
                    crackSrc.buffer = this.ensureNoiseBuffer();
                    const crackFilter = ctx.createBiquadFilter();
                    crackFilter.type = 'highpass';
                    crackFilter.frequency.setValueAtTime(480, now);
                    const crackGain = ctx.createGain();
                    crackGain.gain.setValueAtTime(0.24, now);
                    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
                    crackSrc.connect(crackFilter);
                    crackFilter.connect(crackGain);
                    crackGain.connect(this.getSfxDest());
                    crackSrc.start(now);
                    crackSrc.stop(now + 0.34);
                } catch (e) {
                    console.warn("SFX playRockCrack error:", e);
                }
            }

            playGemChime() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const ctx = this.ctx;
                    const now = ctx.currentTime;
                    const notes = [880, 1174.66, 1567.98];
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
                        const t0 = now + i * 0.055;
                        osc.frequency.setValueAtTime(freq, t0);
                        gain.gain.setValueAtTime(0.001, t0);
                        gain.gain.linearRampToValueAtTime(0.14, t0 + 0.015);
                        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
                        osc.connect(gain);
                        gain.connect(this.getSfxDest());
                        osc.start(t0);
                        osc.stop(t0 + 0.30);
                    });
                } catch (e) {
                    console.warn("SFX playGemChime error:", e);
                }
            }

            playCavernDiscovery() {
                if (!this.enabled) return;
                this.init();
                if (!this.ctx) return;
                try {
                    const ctx = this.ctx;
                    const now = ctx.currentTime;
                    const fanfare = [392.0, 493.88, 587.33, 783.99];
                    fanfare.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        const t0 = now + i * 0.09;
                        const dur = i === fanfare.length - 1 ? 0.55 : 0.22;
                        osc.frequency.setValueAtTime(freq, t0);
                        gain.gain.setValueAtTime(0.001, t0);
                        gain.gain.linearRampToValueAtTime(0.17, t0 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
                        osc.connect(gain);
                        gain.connect(this.getSfxDest());
                        osc.start(t0);
                        osc.stop(t0 + dur + 0.02);
                    });
                } catch (e) {
                    console.warn("SFX playCavernDiscovery error:", e);
                }
            }
        }

export const sfx = new RescueSoundFX();

if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        if (sfx) {
            sfx.init();
            if (sfx.ctx && sfx.ctx.state === 'suspended') {
                sfx.ctx.resume();
            }
        }
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, unlockAudio, { passive: true });
    });
}

export default sfx;

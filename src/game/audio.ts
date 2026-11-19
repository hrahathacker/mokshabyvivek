import { SubtitleState, VictorySongData } from './types';

export type GhostVoiceKey = 'patrol' | 'spot' | 'near' | 'ritual' | 'victory';
export type PlayerReactionKey = 'spot' | 'hide' | 'escape' | 'climax';

interface VoiceLine {
  hindi: string;
  hinglish: string;
  ttsPrompt: string;
}

export const GHOST_VOICE_LINES: Record<GhostVoiceKey, VoiceLine> = {
  patrol: {
    hindi: 'कौन है वहाँ...?',
    hinglish: 'Kaun hai wahan...?',
    ttsPrompt: 'कौन है वहाँ...? <breath> कोई तो आया है इस हवेली में...',
  },
  spot: {
    hindi: 'भाग के कहाँ जाओगे...?',
    hinglish: 'Bhaag ke kahan jaoge...?',
    ttsPrompt: '<gasp> भाग के कहाँ जाओगे...? <breath> मुझे अकेला मत छोड़ो...',
  },
  near: {
    hindi: 'पीछे मत मुड़ना...',
    hinglish: 'Peechhe mat mudna...',
    ttsPrompt: '<breath> पीछे मत मुड़ना... मैं यहीं हूँ...',
  },
  ritual: {
    hindi: 'मुझे मुक्ति चाहिए...',
    hinglish: 'Mujhe mukti chahiye...',
    ttsPrompt: '<gasp> मुझे मुक्ति चाहिए... आख़िरी हवन पूरा करो...',
  },
  victory: {
    hindi: 'धन्यवाद... अब मुझे शांति मिली...',
    hinglish: 'Dhanyavaad... ab mujhe shanti mili...',
    ttsPrompt: '<breath> धन्यवाद... अब मुझे शांति मिली... मेरी पायल अब थम गई...',
  },
};

export const PLAYER_REACTIONS: Record<PlayerReactionKey, { hindi: string; hinglish: string }> = {
  spot: {
    hindi: 'हे भगवान... वो यहीं है!',
    hinglish: 'Hey bhagwan... woh yahin hai!',
  },
  hide: {
    hindi: 'श्श्श... साँस रोको... टॉर्च बंद करो...',
    hinglish: 'Shhh... saans roko... torch band karo...',
  },
  escape: {
    hindi: 'बच गया... शुक्र है वो चली गई...',
    hinglish: 'Bach gaya... shukar hai woh chali gayi...',
  },
  climax: {
    hindi: 'आख़िरी हवन जल उठा... बस कुछ सेकंड और!',
    hinglish: 'Aakhiri havan jal utha... bas kuch second aur!',
  },
};

export interface CustomAudioTrackMap {
  ambience?: string;
  chase?: string;
  templeBell?: string;
  payal?: string;
  jumpscare?: string;
}

export class HorrorAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private tensionGain: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private ghostReverb: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private unlocked = false;
  private volume = 0.82;
  private muted = false;
  private lastVoiceTime = 0;
  private lastPlayerVoiceTime = 0;
  private subtitleSeq = 0;
  private onSubtitle?: (sub: SubtitleState | null) => void;
  private subtitleTimeout: number | null = null;
  private customTracks: CustomAudioTrackMap = {};
  private customElements: Map<string, HTMLAudioElement> = new Map();

  // Cached decoded Gemini AI TTS AudioBuffers
  private ghostVoiceBuffers: Map<GhostVoiceKey, AudioBuffer> = new Map();
  private prewarmStarted = false;

  // Story narration active source
  private narrationSource: AudioBufferSourceNode | null = null;
  private narrationAudioEl: HTMLAudioElement | null = null;

  // Victory Ghost Song ("Moksha Geet") playback engine
  private songPlaying = false;
  private songInterval: number | null = null;
  private songStep = 0;
  private songStartTime = 0;
  private songGain: GainNode | null = null;
  private songVocalSource: AudioBufferSourceNode | null = null;
  private songOscs: OscillatorNode[] = [];
  private activeSongData: VictorySongData | null = null;
  private onSongStateChange?: (playing: boolean, lyricIndex: number) => void;

  constructor(
    onSubtitle?: (sub: SubtitleState | null) => void,
    customTracks?: CustomAudioTrackMap
  ) {
    this.onSubtitle = onSubtitle;
    if (customTracks) {
      this.customTracks = customTracks;
    }
  }

  public setSongListener(cb: (playing: boolean, lyricIndex: number) => void): void {
    this.onSongStateChange = cb;
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      this.ghostReverb = this.createDarkReverb(this.ctx);
      this.ghostReverb.connect(this.masterGain);
      this.startAmbientLayers();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
  }

  /**
   * Local instant voice initialization — zero runtime API calls so phones never wait or fail.
   */
  public prewarmGhostVoices(): void {
    if (this.prewarmStarted) return;
    this.prewarmStarted = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Speaks story chapter text locally using Hindi/Indian voice synthesis with atmospheric chime.
   */
  public playLocalStoryNarration(text: string): void {
    this.stopStoryNarration();
    this.unlock();
    if (this.muted) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'hi-IN';
        utter.pitch = 0.82;
        utter.rate = 0.88;
        utter.volume = Math.max(0.25, Math.min(1, this.volume));

        const voices = window.speechSynthesis.getVoices();
        const hiVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
          voices.find((v) => v.lang.toLowerCase().includes('in'));
        if (hiVoice) {
          utter.voice = hiVoice;
        }
        window.speechSynthesis.speak(utter);
      } catch {
        // ignore if unsupported
      }
    }
  }

  public stopStoryNarration(): void {
    if (this.narrationSource) {
      try {
        this.narrationSource.stop();
      } catch {
        // ignore
      }
      this.narrationSource = null;
    }
    if (this.narrationAudioEl) {
      this.narrationAudioEl.pause();
      this.narrationAudioEl = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    this.applyMasterGain();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMasterGain();
    if (muted && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private applyMasterGain(): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.06);
    }
    this.customElements.forEach((el) => {
      el.volume = this.muted ? 0 : this.volume;
    });
    if (this.narrationAudioEl) {
      this.narrationAudioEl.volume = this.muted ? 0 : this.volume;
    }
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 2.8;
    }
    return buffer;
  }

  /**
   * Procedural 2.6-second stereo dark haveli stone-hall impulse response for terrifying ghost echo
   */
  private createDarkReverb(ctx: AudioContext): ConvolverNode {
    const duration = 2.6;
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const decay = Math.pow(1 - i / len, 2.7);
        const white = (Math.random() * 2 - 1) * decay;
        lp = lp * 0.68 + white * 0.32; // Dark damp stone absorption
        data[i] = lp * 0.72;
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  private startAmbientLayers(): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // 1. Haunting dissonant Indian Tanpura minor drone
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.16, now);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(280, now);
    droneFilter.Q.value = 3.4;

    const filterLfo = this.ctx.createOscillator();
    filterLfo.frequency.value = 0.13;
    const filterLfoGain = this.ctx.createGain();
    filterLfoGain.gain.value = 115;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(droneFilter.frequency);
    filterLfo.start(now);

    const freqs = [73.42, 110.0, 77.78, 146.83];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f + (idx - 1.5) * 0.3, now);
      const g = this.ctx.createGain();
      g.gain.value = idx === 2 ? 0.15 : 0.24;
      osc.connect(g);
      g.connect(droneFilter);
      osc.start(now);
    });

    droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    // 2. Cold haveli night wind
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, now);
    windFilter.Q.value = 2.6;

    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.value = 0.085;
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 190;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start(now);

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.18;
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windSrc.start(now);

    // 3. Rising dissonant bowed-string chase terror bed
    this.tensionGain = this.ctx.createGain();
    this.tensionGain.gain.setValueAtTime(0.0001, now);

    const tensionFilter = this.ctx.createBiquadFilter();
    tensionFilter.type = 'bandpass';
    tensionFilter.frequency.value = 840;
    tensionFilter.Q.value = 2.1;

    [220, 233.08, 311.13, 466.16].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const vib = this.ctx.createOscillator();
      vib.frequency.value = 5.2 + i * 0.4;
      const vibGain = this.ctx.createGain();
      vibGain.gain.value = 4.6;
      vib.connect(vibGain);
      vibGain.connect(osc.frequency);
      vib.start(now);
      osc.connect(tensionFilter);
      osc.start(now);
    });

    tensionFilter.connect(this.tensionGain);
    this.tensionGain.connect(this.masterGain);

    // 4. Havan fire crackle bed
    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.setValueAtTime(0.0001, now);
    const fireSrc = this.ctx.createBufferSource();
    fireSrc.buffer = this.noiseBuffer;
    fireSrc.loop = true;
    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'bandpass';
    fireFilter.frequency.value = 1200;
    fireFilter.Q.value = 0.8;
    fireSrc.connect(fireFilter);
    fireFilter.connect(this.fireGain);
    this.fireGain.connect(this.masterGain);
    fireSrc.start(now);
  }

  public setTension(intensity: number, isClimax: boolean): void {
    if (!this.ctx || !this.tensionGain || !this.fireGain || !this.droneGain) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetTension = this.songPlaying ? 0.0001 : isClimax ? 0.25 : clamped * 0.22;
    this.tensionGain.gain.setTargetAtTime(Math.max(0.0001, targetTension), now, 0.22);
    this.fireGain.gain.setTargetAtTime(isClimax ? 0.28 : 0.0001, now, 0.32);
    this.droneGain.gain.setTargetAtTime(this.songPlaying ? 0.03 : 0.16, now, 0.4);
  }

  // =========================================================================
  // UPGRADED TERRIFYING GHOST AUDIO SFX
  // =========================================================================

  /**
   * Distant eerie haunting female wail/sob echoing down dark haveli corridors
   */
  public playGhostWail(distance: number, pan = 0): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const prox = Math.max(0.12, Math.min(1, 1 - distance / 24));
    const now = this.ctx.currentTime;

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const dest = panner ?? this.masterGain;
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, pan)), now);
      panner.connect(this.masterGain);
      if (this.ghostReverb) panner.connect(this.ghostReverb);
    }

    // Two eerie weeping formant voices gliding down a minor 3rd
    [520, 526].forEach((startFreq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.12, now + 0.55);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.72, now + 2.3);

      // Haunting vocal tremble
      const vib = this.ctx.createOscillator();
      vib.frequency.value = 6.2;
      const vibG = this.ctx.createGain();
      vibG.gain.value = 14;
      vib.connect(vibG);
      vibG.connect(osc.frequency);
      vib.start(now);
      vib.stop(now + 2.45);

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(920, now);
      bp.frequency.exponentialRampToValueAtTime(520, now + 2.3);
      bp.Q.value = 4.2;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.15 * prox, now + 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(bp);
      bp.connect(g);
      g.connect(dest);
      osc.start(now);
      osc.stop(now + 2.45);
    });
  }

  /**
   * Sudden bone-chilling dread sting + metallic scrape when ghost spots you!
   */
  public playChaseSting(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    // Sub-bass dread drop
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(98, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.75);
    const subG = this.ctx.createGain();
    subG.gain.setValueAtTime(0.45, now);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    sub.connect(subG);
    subG.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.9);

    // High dissonant horror violin screech (minor second cluster)
    [1244.5, 1318.5, 1864.7].forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.65);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.075, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      osc.connect(g);
      g.connect(this.masterGain);
      if (this.ghostReverb) g.connect(this.ghostReverb);
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  public playDistantKnock(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    // 3 eerie slow hollow wooden knocks
    [0, 0.34, 0.68].forEach((offset) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145, t);
      osc.frequency.exponentialRampToValueAtTime(62, t + 0.09);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.24, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(g);
      g.connect(this.masterGain);
      if (this.ghostReverb) g.connect(this.ghostReverb);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  public playTempleBell(volumeScale = 0.55): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const baseFreq = 294;
    const partials = [
      { mult: 1.0, gain: 0.45, decay: 4.2 },
      { mult: 2.02, gain: 0.26, decay: 3.1 },
      { mult: 2.76, gain: 0.16, decay: 2.3 },
      { mult: 4.07, gain: 0.09, decay: 1.5 },
    ];

    partials.forEach((p) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.mult, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(p.gain * volumeScale * 0.45, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    });
  }

  public playPayalChime(distance: number, pan = 0): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const maxDist = 21;
    if (distance > maxDist) return;
    const proximity = Math.pow(1 - distance / maxDist, 1.75);
    if (proximity < 0.03) return;

    const now = this.ctx.currentTime;
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const dest = panner ?? this.masterGain;
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-0.9, Math.min(0.9, pan)), now);
      panner.connect(this.masterGain);
      if (this.ghostReverb) panner.connect(this.ghostReverb);
    }

    const bellFreqs = [3420, 4180, 5290, 6110, 7040];
    bellFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.02 + Math.random() * 0.015;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 190, t);

      const g = this.ctx.createGain();
      const peak = 0.125 * proximity * (0.7 + Math.random() * 0.4);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26 + Math.random() * 0.15);

      osc.connect(g);
      g.connect(dest);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // =========================================================================
  // NEW IMMERSIVE PLAYER SOUNDS (BREATHING, PANTING, GASPS, FOLEY, WHISPERS)
  // =========================================================================

  /**
   * Realistic dynamic player breathing / panicked panting / muffled almirah breath
   */
  public playPlayerBreath(panicLevel: number, isSprinting: boolean, isHiding: boolean): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const intensity = Math.max(0.15, Math.min(1, panicLevel + (isSprinting ? 0.35 : 0)));
    const dur = isSprinting ? 0.38 : isHiding ? 0.55 : 0.68;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    // Breath formant bandpass (tight & muffled if hiding inside wooden cupboard)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHiding ? 760 : isSprinting ? 1320 : 980, now);
    filter.frequency.exponentialRampToValueAtTime(isHiding ? 520 : 680, now + dur);
    filter.Q.value = isHiding ? 3.8 : 2.2;

    const g = this.ctx.createGain();
    const vol = (isSprinting ? 0.14 : isHiding ? 0.11 : 0.085) * intensity;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + dur * 0.28);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(now, Math.random() * 1.0, dur + 0.04);
  }

  /**
   * Sharp startled human gasp when seeing the ghost suddenly!
   */
  public playPlayerGasp(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1050, now);
    f.frequency.exponentialRampToValueAtTime(2150, now + 0.22);
    f.Q.value = 3.2;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.26, now + 0.045);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    src.connect(f);
    f.connect(g);
    g.connect(this.masterGain);
    src.start(now, Math.random() * 0.8, 0.32);
  }

  /**
   * Relieved quiet exhale sigh after surviving a close chase
   */
  public playPlayerExhaleRelief(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(920, now);
    f.frequency.exponentialRampToValueAtTime(420, now + 0.9);
    f.Q.value = 1.9;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    src.connect(f);
    f.connect(g);
    g.connect(this.masterGain);
    src.start(now, Math.random() * 0.5, 1.0);
  }

  public playPlayerReaction(key: PlayerReactionKey): void {
    const nowMs = performance.now();
    if (nowMs - this.lastPlayerVoiceTime < 7500) return;
    this.lastPlayerVoiceTime = nowMs;

    if (key === 'spot') this.playPlayerGasp();
    if (key === 'escape') this.playPlayerExhaleRelief();

    const line = PLAYER_REACTIONS[key];
    this.subtitleSeq += 1;
    this.onSubtitle?.({
      hindi: line.hindi,
      hinglish: line.hinglish,
      speaker: 'player',
      id: this.subtitleSeq,
    });

    if (this.subtitleTimeout !== null) {
      window.clearTimeout(this.subtitleTimeout);
    }
    this.subtitleTimeout = window.setTimeout(() => {
      this.onSubtitle?.(null);
    }, 3400);
  }

  public playClothRustle(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1400;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.13, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    src.connect(f);
    f.connect(g);
    g.connect(this.masterGain);
    src.start(now, Math.random(), 0.32);
  }

  public playHeartbeat(intensity: number): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const gainScale = 0.1 + intensity * 0.38;

    const thump = (offset: number, startF: number, endF: number, vol: number) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startF, t);
      osc.frequency.exponentialRampToValueAtTime(endF, t + 0.13);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.19);
    };

    thump(0, 66, 33, gainScale);
    thump(0.155, 58, 29, gainScale * 0.74);
  }

  public playFootstep(isSprint: boolean, isCourtyard = true): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = isCourtyard ? 520 : 310; // Gritty stone vs hollow room floor
    filter.frequency.value = baseFreq + (isSprint ? 150 : 0) + Math.random() * 110;
    filter.Q.value = isCourtyard ? 1.5 : 2.6;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(isSprint ? 0.22 : 0.12, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(now, Math.random() * 1.2, 0.14);

    // Subtle shoe-heel thud
    const heel = this.ctx.createOscillator();
    heel.type = 'sine';
    heel.frequency.setValueAtTime(isCourtyard ? 118 : 88, now);
    heel.frequency.exponentialRampToValueAtTime(42, now + 0.06);
    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(isSprint ? 0.14 : 0.07, now);
    hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    heel.connect(hg);
    hg.connect(this.masterGain);
    heel.start(now);
    heel.stop(now + 0.08);
  }

  public playFlashlightClick(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.032);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.17, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playWoodCreak(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    this.playClothRustle();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(248, now + 0.24);
    osc.frequency.exponentialRampToValueAtTime(122, now + 0.56);

    const mod = this.ctx.createOscillator();
    mod.frequency.value = 28;
    const modGain = this.ctx.createGain();
    modGain.gain.value = 42;
    mod.connect(modGain);
    modGain.connect(osc.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 640;
    filter.Q.value = 3.5;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.6);
    osc.stop(now + 0.6);
  }

  public playItemPickup(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playHavanPlace(isFinal: boolean): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    this.playTempleBell(isFinal ? 0.95 : 0.65);
    const now = this.ctx.currentTime;
    if (this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isFinal ? 1850 : 950, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + (isFinal ? 1.5 : 0.7));
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(isFinal ? 0.44 : 0.22, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (isFinal ? 1.6 : 0.75));
      src.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);
      src.start(now, 0, 1.7);
    }
  }

  public playJumpscare(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. Massive sub-bass slam
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 1.0);
    const subG = this.ctx.createGain();
    subG.gain.setValueAtTime(0.85, now);
    subG.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    sub.connect(subG);
    subG.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 1.15);

    // 2. Terrifying distorted multi-voice female banshee shriek
    const shriekFreqs = [622, 668, 932, 1318, 1520, 2093];
    shriekFreqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(f * 1.22, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.68, now + 1.2);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.16, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
      osc.connect(g);
      g.connect(this.masterGain);
      if (this.ghostReverb) g.connect(this.ghostReverb);
      osc.start(now);
      osc.stop(now + 1.3);
    });

    // 3. Harsh noise rip + metallic payal crash
    if (this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 850;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.52, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      src.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);
      src.start(now, 0, 1.05);
    }
    this.playPayalChime(1.0, 0);
  }

  public playShantiChord(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [293.66, 369.99, 440.0, 587.33, 739.99];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const t = now + i * 0.14;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 4.3);
    });
    this.playTempleBell(0.75);
  }

  private playSynthWhisperFallback(): void {
    if (!this.unlocked || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.36;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(980 + i * 240, t);
      f.frequency.exponentialRampToValueAtTime(580, t + 0.34);
      f.Q.value = 7.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
      src.connect(f);
      f.connect(g);
      g.connect(this.masterGain);
      if (this.ghostReverb) g.connect(this.ghostReverb);
      src.start(t, Math.random(), 0.4);
    }
  }

  /**
   * Speaks chilling Hindi ghost lines:
   * Prefers pre-warmed Gemini 3.8 Flash TTS WAV routed through demonic dual-pitch + cathedral reverb,
   * with automatic fallback to layered synth whispers + low eerie Web Speech API.
   */
  public speakGhostLine(key: GhostVoiceKey, force = false): void {
    const nowMs = performance.now();
    if (!force && nowMs - this.lastVoiceTime < 6500) return;
    this.lastVoiceTime = nowMs;

    const line = GHOST_VOICE_LINES[key];
    this.subtitleSeq += 1;
    this.onSubtitle?.({
      hindi: line.hindi,
      hinglish: line.hinglish,
      speaker: 'ghost',
      id: this.subtitleSeq,
    });

    if (this.subtitleTimeout !== null) {
      window.clearTimeout(this.subtitleTimeout);
    }
    this.subtitleTimeout = window.setTimeout(() => {
      this.onSubtitle?.(null);
    }, 4400);

    if (this.muted) return;

    const aiBuf = this.ghostVoiceBuffers.get(key);
    if (aiBuf && this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const isPeaceful = key === 'victory';

      // Layer 1: Primary haunting ghost voice
      const mainSrc = this.ctx.createBufferSource();
      mainSrc.buffer = aiBuf;
      mainSrc.playbackRate.value = isPeaceful ? 0.96 : 0.92;

      const mainGain = this.ctx.createGain();
      mainGain.gain.value = 0.92;
      mainSrc.connect(mainGain);
      mainGain.connect(this.masterGain);

      if (this.ghostReverb) {
        const wet = this.ctx.createGain();
        wet.gain.value = isPeaceful ? 0.52 : 0.72;
        mainSrc.connect(wet);
        wet.connect(this.ghostReverb);
      }
      mainSrc.start(now);

      // Layer 2: Demonic pitch-lowered whisper echo shadow (for non-victory horror lines!)
      if (!isPeaceful) {
        const shadowSrc = this.ctx.createBufferSource();
        shadowSrc.buffer = aiBuf;
        shadowSrc.playbackRate.value = 0.78;

        const lowFilter = this.ctx.createBiquadFilter();
        lowFilter.type = 'lowpass';
        lowFilter.frequency.value = 950;

        const shadowGain = this.ctx.createGain();
        shadowGain.gain.value = 0.42;

        shadowSrc.connect(lowFilter);
        lowFilter.connect(shadowGain);
        shadowGain.connect(this.masterGain);
        if (this.ghostReverb) shadowGain.connect(this.ghostReverb);
        shadowSrc.start(now + 0.09);
      }
      return;
    }

    // Fallback: eerie whispered formants + low creepy Web Speech API
    this.playSynthWhisperFallback();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(line.hindi);
        utter.lang = 'hi-IN';
        utter.pitch = key === 'victory' ? 0.88 : 0.56;
        utter.rate = key === 'victory' ? 0.84 : 0.72;
        utter.volume = Math.max(0.2, Math.min(1, this.volume));

        const voices = window.speechSynthesis.getVoices();
        const hiVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
          voices.find((v) => v.lang.toLowerCase().includes('in'));
        if (hiVoice) {
          utter.voice = hiVoice;
        }
        window.speechSynthesis.speak(utter);
      } catch {
        // whisper fallback already active
      }
    }
  }

  // =========================================================================
  // ORIGINAL VICTORY GHOST SONG ("MOKSHA GEET — AAKHIRI SHANTI")
  // Multi-instrument Indian Raga Bhairavi -> Raga Yaman + AI Ethereal Vocals
  // =========================================================================

  private playSitarPluck(freq: number, time: number, vol = 0.15): void {
    if (!this.ctx || !this.songGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    // Subtle meend (Indian pitch slide bend)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.008, time + 0.14);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.45);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 3.2, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 1.4);
    filter.Q.value = 3.6;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.85);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.songGain);
    if (this.ghostReverb) g.connect(this.ghostReverb);
    osc.start(time);
    osc.stop(time + 1.9);
  }

  private playBansuriNote(freq: number, time: number, duration: number, vol = 0.11): void {
    if (!this.ctx || !this.songGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.985, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.18);

    // Warm bamboo flute vibrato
    const vib = this.ctx.createOscillator();
    vib.frequency.value = 4.6;
    const vibG = this.ctx.createGain();
    vibG.gain.value = 3.5;
    vib.connect(vibG);
    vibG.connect(osc.frequency);
    vib.start(time);
    vib.stop(time + duration + 0.1);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.25);
    g.gain.setValueAtTime(vol * 0.85, time + duration * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(g);
    g.connect(this.songGain);
    if (this.ghostReverb) g.connect(this.ghostReverb);
    osc.start(time);
    osc.stop(time + duration + 0.08);
  }

  /**
   * Haunting-to-heavenly Indian classical female vocal "Alaap" choir synth (dual formant vowel filters + vibrato)
   */
  private playEtherealAlaap(freq: number, time: number, duration: number, vol = 0.13): void {
    if (!this.ctx || !this.songGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq * 0.97, time);
    osc1.frequency.exponentialRampToValueAtTime(freq, time + 0.35);
    osc2.frequency.setValueAtTime(freq * 1.003, time);

    const vib = this.ctx.createOscillator();
    vib.frequency.value = 5.1;
    const vibG = this.ctx.createGain();
    vibG.gain.value = freq * 0.012;
    vib.connect(vibG);
    vibG.connect(osc1.frequency);
    vibG.connect(osc2.frequency);

    // Warm female "Aaaah / Ooooh" vowel formant filters
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(680, time);
    f1.frequency.linearRampToValueAtTime(520, time + duration);
    f1.Q.value = 4.5;

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1240, time);
    f2.frequency.linearRampToValueAtTime(1020, time + duration);
    f2.Q.value = 5.2;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(vol, time + 0.55);
    env.gain.setValueAtTime(vol * 0.88, time + duration * 0.68);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(f1);
    osc1.connect(f2);
    osc2.connect(f1);
    f1.connect(env);
    f2.connect(env);
    env.connect(this.songGain);
    if (this.ghostReverb) {
      const wet = this.ctx.createGain();
      wet.gain.value = 0.72;
      env.connect(wet);
      wet.connect(this.ghostReverb);
    }

    vib.start(time);
    osc1.start(time);
    osc2.start(time);
    vib.stop(time + duration + 0.1);
    osc1.stop(time + duration + 0.1);
    osc2.stop(time + duration + 0.1);
  }

  /**
   * Soft resonant Indian Tabla / Manjira percussion pulse
   */
  private playTablaTap(time: number, isBayan: boolean): void {
    if (!this.ctx || !this.songGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    if (isBayan) {
      osc.frequency.setValueAtTime(148, time);
      osc.frequency.exponentialRampToValueAtTime(86, time + 0.16);
    } else {
      osc.frequency.setValueAtTime(340, time);
      osc.frequency.exponentialRampToValueAtTime(294, time + 0.09);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(isBayan ? 0.16 : 0.09, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + (isBayan ? 0.24 : 0.14));
    osc.connect(g);
    g.connect(this.songGain);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  public async startVictorySong(songData: VictorySongData): Promise<void> {
    this.stopVictorySong();
    this.unlock();
    if (!this.ctx || !this.masterGain) return;

    this.activeSongData = songData;
    this.songPlaying = true;
    this.songStep = 0;
    this.songStartTime = performance.now();
    this.setTension(0, false);

    this.songGain = this.ctx.createGain();
    this.songGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.songGain.gain.linearRampToValueAtTime(0.95, this.ctx.currentTime + 1.0);
    this.songGain.connect(this.masterGain);

    // Warm Golden Tanpura Drone (D3 - A3 - D4)
    const now = this.ctx.currentTime;
    const droneFreqs = [146.83, 220.0, 293.66];
    this.songOscs = droneFreqs.map((f, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx === 1 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.value = 0.08;
      osc.connect(g);
      g.connect(this.songGain!);
      osc.start(now);
      return osc;
    });

    // Haunting Bhairavi (bars 0-15) -> Serene Golden Moksha Yaman (bars 16-31)
    const bhairaviMelody = [
      293.66, 311.13, 349.23, 311.13, 293.66, 261.63, 293.66, 440.0,
      466.16, 440.0, 392.0, 349.23, 311.13, 293.66, 349.23, 293.66,
    ];
    const yamanMelody = [
      293.66, 329.63, 369.99, 440.0, 493.88, 554.37, 587.33, 493.88,
      440.0, 369.99, 329.63, 369.99, 440.0, 587.33, 440.0, 293.66,
    ];

    const tickBeat = () => {
      if (!this.songPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const step = this.songStep;
      const isPeacefulHalf = step >= 16;
      const notes = isPeacefulHalf ? yamanMelody : bhairaviMelody;
      const noteFreq = notes[step % notes.length];

      // 1. Plucked Sitar melody every beat
      this.playSitarPluck(noteFreq, t, isPeacefulHalf ? 0.14 : 0.16);

      // 2. Soft Tabla rhythmic pulse
      if (step % 4 === 0) {
        this.playTablaTap(t, true);
      } else if (step % 2 === 0) {
        this.playTablaTap(t, false);
      }

      // 3. Ethereal Ghost Female Vocal Alaap Choir every 4 beats
      if (step % 4 === 0) {
        this.playEtherealAlaap(noteFreq * 2, t + 0.05, 2.85, isPeacefulHalf ? 0.15 : 0.12);
      }

      // 4. Airy Bansuri bamboo flute counter-melody offset by 2 beats
      if (step % 4 === 2) {
        this.playBansuriNote(noteFreq * 2, t + 0.08, 2.2, isPeacefulHalf ? 0.11 : 0.085);
      }

      // 5. Soft sacred temple manjira chime every 8 beats
      if (step % 8 === 0) {
        this.playTempleBell(isPeacefulHalf ? 0.42 : 0.28);
      }

      // Update active synchronized lyric stanza (loops cleanly every ~26s)
      const elapsedSec = ((performance.now() - this.songStartTime) / 1000) % 26;
      const lyrics = this.activeSongData?.lyrics ?? [];
      let lyricIdx = 0;
      for (let i = 0; i < lyrics.length; i++) {
        if (elapsedSec >= lyrics[i].timeSec) lyricIdx = i;
      }
      this.onSongStateChange?.(true, lyricIdx);

      this.songStep = (step + 1) % 32;
    };

    tickBeat();
    this.songInterval = window.setInterval(tickBeat, 740);
    this.onSongStateChange?.(true, 0);
  }

  public stopVictorySong(): void {
    this.songPlaying = false;
    if (this.songInterval !== null) {
      window.clearInterval(this.songInterval);
      this.songInterval = null;
    }
    if (this.songVocalSource) {
      try {
        this.songVocalSource.stop();
      } catch {
        // ignore
      }
      this.songVocalSource = null;
    }
    this.songOscs.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // ignore
      }
    });
    this.songOscs = [];
    if (this.songGain && this.ctx) {
      try {
        this.songGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
      } catch {
        // ignore
      }
      this.songGain = null;
    }
    this.onSongStateChange?.(false, 0);
  }

  public isVictorySongPlaying(): boolean {
    return this.songPlaying;
  }

  public loadCustomTrack(key: keyof CustomAudioTrackMap, url: string): void {
    this.customTracks[key] = url;
    const el = new Audio(url);
    el.volume = this.muted ? 0 : this.volume;
    this.customElements.set(key, el);
  }

  public dispose(): void {
    this.stopStoryNarration();
    this.stopVictorySong();
    if (this.subtitleTimeout !== null) {
      window.clearTimeout(this.subtitleTimeout);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.customElements.forEach((el) => {
      el.pause();
      el.src = '';
    });
    this.customElements.clear();
  }
}

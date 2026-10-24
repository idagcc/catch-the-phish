export type GameSound = 'tap' | 'key' | 'transition' | 'correct' | 'incorrect' | 'complete';
export type AudioScene = 'idle' | 'registration' | 'instructions' | 'quiz' | 'result';

const MUTE_KEY = 'catch-the-phish.audio-muted.v1';
const MUSIC_URL = `${import.meta.env.BASE_URL}audio/cyber-loop.ogg`;

/** One audio graph per application, shared across React renders and game rounds. */
class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private unlocked = false;
  private isMuted = false;
  private scene: AudioScene = 'idle';
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPlayed = new Map<GameSound, number>();
  private visibilityListener = () => {
    if (document.hidden) this.fadeAndPause();
    else if (this.unlocked && !this.isMuted) this.resume();
  };

  constructor() {
    try { this.isMuted = localStorage.getItem(MUTE_KEY) === 'true'; } catch { /* Storage may be unavailable. */ }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityListener);
    }
  }

  get muted(): boolean { return this.isMuted; }

  /** Release the singleton during development replacement or explicit teardown. */
  dispose(): void {
    if (this.pauseTimer) { clearTimeout(this.pauseTimer); this.pauseTimer = null; }
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibilityListener);
    this.music?.pause();
    this.music?.remove();
    this.music = null;
    const context = this.context;
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.effectsGain = null;
    this.unlocked = false;
    this.lastPlayed.clear();
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }

  /** Call synchronously from a pointer/key gesture to satisfy browser autoplay rules. */
  unlock(): void {
    this.unlocked = true;
    if (this.isMuted || (typeof document !== 'undefined' && document.hidden)) return;
    this.resume();
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try { localStorage.setItem(MUTE_KEY, String(this.isMuted)); } catch { /* Mute still works for this session. */ }
    if (this.isMuted) this.fadeAndPause();
    else {
      this.unlocked = true;
      this.resume();
    }
    return this.isMuted;
  }

  setScene(scene: AudioScene): void {
    this.scene = scene;
    if (this.context && this.musicGain && !this.isMuted && !document.hidden) {
      this.ramp(this.musicGain, this.musicLevel(), 0.7);
    }
  }

  play(sound: GameSound): void {
    if (!this.unlocked || this.isMuted || (typeof document !== 'undefined' && document.hidden)) return;
    const context = this.ensureGraph();
    if (!context) return;
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    const now = context.currentTime;
    const interval = sound === 'key' ? 0.025 : sound === 'tap' ? 0.055 : sound === 'complete' ? 1.2 : 0.2;
    if (now - (this.lastPlayed.get(sound) ?? -10) < interval) return;
    this.lastPlayed.set(sound, now);
    switch (sound) {
      case 'tap':
        // Bright glass chime, audible over the quiet background score.
        this.tone(1046.502, now, 0.24, 0.14);
        this.tone(1318.51, now + 0.028, 0.21, 0.075);
        this.tone(2093.005, now + 0.006, 0.13, 0.025);
        break;
      case 'key':
        this.tone(1174.659, now, 0.095, 0.075);
        this.tone(2349.318, now + 0.006, 0.06, 0.022);
        break;
      case 'transition':
        this.tone(220, now, 0.24, 0.07, 'sine', 660);
        this.tone(440, now + 0.035, 0.2, 0.04, 'triangle', 880);
        break;
      case 'correct':
        [659.255, 987.767, 1318.51].forEach((frequency, index) => {
          this.tone(frequency, now + index * 0.075, 0.36, 0.1 - index * 0.015);
        });
        break;
      case 'incorrect':
        this.tone(293.665, now, 0.28, 0.09, 'triangle', 261.626);
        this.tone(220, now + 0.09, 0.28, 0.075, 'sine', 195.998);
        break;
      case 'complete':
        [329.628, 493.883, 659.255, 783.991, 987.767, 1318.51].forEach((frequency, index) => {
          this.tone(frequency, now + index * 0.1, 0.75, 0.09 - index * 0.007);
        });
        break;
    }
  }

  private musicLevel(): number { return this.scene === 'quiz' ? 0.11 : this.scene === 'result' ? 0.2 : 0.17; }

  private ensureGraph(): AudioContext | null {
    if (this.context) return this.context;
    if (typeof window === 'undefined' || !window.AudioContext) return null;
    try {
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = 0.8;
      master.connect(context.destination);
      const musicGain = context.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(master);
      const effectsGain = context.createGain();
      effectsGain.gain.value = 0.65;
      effectsGain.connect(master);
      const music = new Audio(MUSIC_URL);
      music.dataset.audioContextState = context.state;
      context.onstatechange = () => { music.dataset.audioContextState = context.state; };
      music.loop = true;
      music.preload = 'auto';
      music.hidden = true;
      music.dataset.gameMusic = '';
      music.setAttribute('aria-hidden', 'true');
      document.body.append(music);
      const source = context.createMediaElementSource(music);
      source.connect(musicGain);
      this.context = context;
      this.master = master;
      this.musicGain = musicGain;
      this.effectsGain = effectsGain;
      this.music = music;
      return context;
    } catch {
      return null;
    }
  }

  private resume(): void {
    if (this.pauseTimer) { clearTimeout(this.pauseTimer); this.pauseTimer = null; }
    const context = this.ensureGraph();
    if (!context || !this.music || !this.musicGain || !this.effectsGain) return;
    void context.resume().catch(() => undefined);
    this.ramp(this.effectsGain, 0.65, 0.12);
    this.ramp(this.musicGain, this.musicLevel(), 1.2);
    if (this.music.paused) void this.music.play().catch(() => undefined);
  }

  private fadeAndPause(): void {
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    if (this.musicGain) this.ramp(this.musicGain, 0, 0.18);
    if (this.effectsGain) this.ramp(this.effectsGain, 0, 0.12);
    this.pauseTimer = setTimeout(() => {
      this.music?.pause();
      if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined);
      this.pauseTimer = null;
    }, 220);
  }

  private ramp(node: GainNode, value: number, duration: number): void {
    const now = this.context?.currentTime ?? 0;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(node.gain.value, now);
    node.gain.linearRampToValueAtTime(value, now + duration);
  }

  private tone(frequency: number, start: number, duration: number, amplitude: number, type: OscillatorType = 'sine', endFrequency?: number): void {
    const context = this.context;
    if (!context || !this.effectsGain) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration * 0.8);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(amplitude, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.effectsGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}

export const gameAudio = new GameAudio();

if (import.meta.hot) import.meta.hot.dispose(() => gameAudio.dispose());

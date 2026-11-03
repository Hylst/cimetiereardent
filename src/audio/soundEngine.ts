import { HeroId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastOrbTime: number = 0;
  private orbStreak: number = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playShoot(hero: HeroId) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (hero === 'mage') {
      // Crystalline astral bolt chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(720 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      // Warm solar pumpkin fireball launch
      osc.type = 'sine';
      osc.frequency.setValueAtTime(290 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(125, now + 0.16);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playHit(isSplash: boolean = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSplash ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(isSplash ? 160 : 240 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + (isSplash ? 0.14 : 0.06));

    gain.gain.setValueAtTime(isSplash ? 0.06 : 0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSplash ? 0.14 : 0.06));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isSplash ? 0.15 : 0.07));
  }

  public playKill(isElite: boolean = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Crisp bone shatter dual tone
    const freqs = isElite ? [320, 480, 640] : [420, 580];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.025);
      osc.frequency.exponentialRampToValueAtTime(f * 0.45, now + idx * 0.025 + 0.11);

      gain.gain.setValueAtTime(0.05, now + idx * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.025);
      osc.stop(now + idx * 0.025 + 0.12);
    });
  }

  public playOrbPickup() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastOrbTime < 0.45) {
      this.orbStreak = Math.min(10, this.orbStreak + 1);
    } else {
      this.orbStreak = 0;
    }
    this.lastOrbTime = now;

    // Mystical pentatonic scale notes
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0];
    const freq = scale[this.orbStreak % scale.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.11);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playNova() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 392.0, 523.25, 783.99];
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.42);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    });
  }

  public playLevelUp() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + i * 0.065;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  }

  public playRelicSelect() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.18);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playWaveBell(isBoss: boolean = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isBoss ? 146.83 : 220.0, now);
    osc.frequency.exponentialRampToValueAtTime(isBoss ? 110.0 : 218.0, now + 0.7);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.76);
  }

  public playPlayerHurt() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const soundEngine = new SoundEngine();

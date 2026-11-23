import { DifficultyTier } from '../core/types.ts';

/**
 * Procedural Web Audio API Sound Synthesizer
 * Zero external audio files, zero latency, runs deterministically in all browsers and XR.
 */
export class SoundFx {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
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

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playSwordSlash(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  public playHitImpact(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Heavy punch/slash impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  }

  public playParryClang(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // High metal ringing sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(1400, ctx.currentTime);
    osc2.frequency.setValueAtTime(1750, ctx.currentTime);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.46);
    osc2.stop(ctx.currentTime + 0.46);
  }

  public playArcaneBurst(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  }

  public playPortalWarp(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.4);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.86);
  }

  public playVictoryChime(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  /**
   * Subtle, tailored auditory feedback for switching between the 4 difficulty tiers.
   * Matches the visual personality and perimeter glow animation of each tier:
   * - Fácil: Soft ascending emerald bloom harmonic (~523Hz -> 1046Hz, gentle sine)
   * - Médio: Crisp azure crystal resonance (~440Hz -> 659Hz, balanced punch)
   * - Difícil: Amber tactical alert surge (~330Hz -> 494Hz, warm filtered saw)
   * - Hard Master: Crimson power ignition (sub-bass drop 130Hz->65Hz + sharp edge 740Hz)
   */
  public playDifficultySwitch(tier: DifficultyTier): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (tier) {
      case DifficultyTier.Facil: {
        // Emerald bloom: soft, harmonic dual-tone upward sweep (gentle, calming, resonant)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5

        osc2.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.20); // C6

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.23);
        osc2.stop(now + 0.23);
        break;
      }

      case DifficultyTier.Medio: {
        // Azure pulse: crisp, balanced metallic crystal strike
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14); // E5

        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(220, now); // A3
        subOsc.frequency.exponentialRampToValueAtTime(329.63, now + 0.14);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 0.18);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 0.21);
        subOsc.stop(now + 0.21);
        break;
      }

      case DifficultyTier.Dificil: {
        // Amber surge: warm brassy alert tone, tighter, tactical resonance
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.16); // B4

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + 0.20);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);
        break;
      }

      case DifficultyTier.HardMasterProfissional: {
        // Crimson tension: sub-bass pulse + high dissonance edge (ominous, sharp ignition)
        const sub = ctx.createOscillator();
        const bite = ctx.createOscillator();
        const gainSub = ctx.createGain();
        const gainBite = ctx.createGain();

        sub.type = 'triangle';
        sub.frequency.setValueAtTime(130.81, now); // C3
        sub.frequency.exponentialRampToValueAtTime(65.41, now + 0.26); // C2 drop

        bite.type = 'sawtooth';
        bite.frequency.setValueAtTime(740, now); // F#5 sharp edge
        bite.frequency.exponentialRampToValueAtTime(587.33, now + 0.14); // D5

        gainSub.gain.setValueAtTime(0.001, now);
        gainSub.gain.linearRampToValueAtTime(0.20, now + 0.025);
        gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        gainBite.gain.setValueAtTime(0.001, now);
        gainBite.gain.linearRampToValueAtTime(0.10, now + 0.015);
        gainBite.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        sub.connect(gainSub);
        gainSub.connect(ctx.destination);

        bite.connect(gainBite);
        gainBite.connect(ctx.destination);

        sub.start(now);
        bite.start(now);
        sub.stop(now + 0.29);
        bite.stop(now + 0.29);
        break;
      }
    }
  }

  /**
   * Ultra-subtle, tactile tick for hovering interactive controls.
   */
  public playHoverSubtleTick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.025);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const sound = new SoundFx();

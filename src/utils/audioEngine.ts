import type { AmbientTrackId } from '../types/reading';

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Record<AmbientTrackId, GainNode | null> = {
    rain: null,
    fireplace: null,
    brownNoise: null,
    ambient: null,
  };
  private isInitialized = false;
  private currentVolumes: Record<AmbientTrackId, number> = {
    rain: 35,
    fireplace: 0,
    brownNoise: 0,
    ambient: 20,
  };
  private playing = false;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    if (!this.isInitialized && this.ctx) {
      this.setupGraph(this.ctx);
      this.isInitialized = true;
    }

    return this.ctx;
  }

  private createNoiseBuffer(
    ctx: AudioContext,
    durationSec: number,
    generator: (sampleIndex: number, totalSamples: number) => number,
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < totalSamples; i++) {
      data[i] = generator(i, totalSamples);
    }

    // Cross-fade the first and last 256 samples for click-free looping
    const fadeSamples = Math.min(512, Math.floor(totalSamples / 10));
    for (let i = 0; i < fadeSamples; i++) {
      const ratio = i / fadeSamples;
      const tailIdx = totalSamples - fadeSamples + i;
      const blended = data[i] * ratio + data[tailIdx] * (1 - ratio);
      data[i] = blended;
      data[tailIdx] = blended;
    }

    return buffer;
  }

  private setupGraph(ctx: AudioContext): void {
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(ctx.destination);

    this.setupRainTrack(ctx);
    this.setupFireplaceTrack(ctx);
    this.setupBrownNoiseTrack(ctx);
    this.setupAmbientDroneTrack(ctx);
  }

  private setupRainTrack(ctx: AudioContext): void {
    if (!this.masterGain) return;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    const buffer = this.createNoiseBuffer(ctx, 5, () => {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      return pink * 0.08;
    });

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1350;
    filter.Q.value = 0.6;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 220;

    // Gentle LFO breathing on rain intensity
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 280;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const trackGain = ctx.createGain();
    trackGain.gain.value = 0;

    source.connect(highpass);
    highpass.connect(filter);
    filter.connect(trackGain);
    trackGain.connect(this.masterGain);
    source.start();

    this.trackGains.rain = trackGain;
  }

  private setupFireplaceTrack(ctx: AudioContext): void {
    if (!this.masterGain) return;

    // Layer 1: Warm low hearth rumble (brown noise)
    let lastOut = 0;
    const rumbleBuffer = this.createNoiseBuffer(ctx, 5, () => {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.025 * white) / 1.025;
      return Math.max(-1, Math.min(1, lastOut * 2.8));
    });

    const rumbleSource = ctx.createBufferSource();
    rumbleSource.buffer = rumbleBuffer;
    rumbleSource.loop = true;

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 260;

    // Layer 2: Organic randomized crackle bursts
    let crackleEnv = 0;
    const crackleBuffer = this.createNoiseBuffer(ctx, 6, () => {
      if (Math.random() < 0.00045) {
        crackleEnv = 0.45 + Math.random() * 0.55;
      }
      crackleEnv *= 0.992;
      const sample = (Math.random() * 2 - 1) * crackleEnv;
      return sample;
    });

    const crackleSource = ctx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    crackleSource.loop = true;

    const crackleBand = ctx.createBiquadFilter();
    crackleBand.type = 'bandpass';
    crackleBand.frequency.value = 1950;
    crackleBand.Q.value = 1.4;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.55;

    const trackGain = ctx.createGain();
    trackGain.gain.value = 0;

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(trackGain);

    crackleSource.connect(crackleBand);
    crackleBand.connect(crackleGain);
    crackleGain.connect(trackGain);

    trackGain.connect(this.masterGain);
    rumbleSource.start();
    crackleSource.start();

    this.trackGains.fireplace = trackGain;
  }

  private setupBrownNoiseTrack(ctx: AudioContext): void {
    if (!this.masterGain) return;
    let lastOut = 0;
    const buffer = this.createNoiseBuffer(ctx, 5, () => {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      return Math.max(-1, Math.min(1, lastOut * 3.1));
    });

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.5;

    const trackGain = ctx.createGain();
    trackGain.gain.value = 0;

    source.connect(filter);
    filter.connect(trackGain);
    trackGain.connect(this.masterGain);
    source.start();

    this.trackGains.brownNoise = trackGain;
  }

  private setupAmbientDroneTrack(ctx: AudioContext): void {
    if (!this.masterGain) return;

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 480;
    padFilter.Q.value = 0.7;

    const trackGain = ctx.createGain();
    trackGain.gain.value = 0;

    // Warm Cadd9 harmonic chord pad (C3, G3, C4, D4)
    const partials: Array<{ freq: number; type: OscillatorType; gain: number }> = [
      { freq: 130.81, type: 'sine', gain: 0.16 },
      { freq: 196.0, type: 'sine', gain: 0.12 },
      { freq: 261.63, type: 'triangle', gain: 0.06 },
      { freq: 293.66, type: 'sine', gain: 0.05 },
    ];

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4; // subtle pitch drift in cents
    lfo.connect(lfoGain);
    lfo.start();

    partials.forEach((p, idx) => {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = p.freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = p.gain;

      if (idx % 2 === 1) {
        lfoGain.connect(osc.detune);
      }

      osc.connect(oscGain);
      oscGain.connect(padFilter);
      osc.start();
    });

    padFilter.connect(trackGain);
    trackGain.connect(this.masterGain);

    this.trackGains.ambient = trackGain;
  }

  public sync(
    volumes: Record<AmbientTrackId, number>,
    isPlaying: boolean,
    isMuted: boolean,
  ): void {
    this.currentVolumes = { ...volumes };
    this.playing = isPlaying;
    this.muted = isMuted;

    const hasActiveVolume = Object.values(volumes).some((v) => v > 0);
    if (!isPlaying && !this.isInitialized) {
      return;
    }

    const ctx = isPlaying && hasActiveVolume ? this.ensureContext() : this.ctx;
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const masterTarget = this.playing && !this.muted ? 0.85 : 0;
    this.masterGain.gain.setTargetAtTime(masterTarget, now, 0.08);

    const trackScale: Record<AmbientTrackId, number> = {
      rain: 0.42,
      fireplace: 0.45,
      brownNoise: 0.38,
      ambient: 0.48,
    };

    (Object.keys(volumes) as AmbientTrackId[]).forEach((track) => {
      const node = this.trackGains[track];
      if (!node) return;
      // Exponential curve feels much more natural on volume sliders
      const normalized = Math.max(0, Math.min(100, volumes[track])) / 100;
      const gainVal = normalized * normalized * trackScale[track];
      node.gain.setTargetAtTime(gainVal, now, 0.06);
    });
  }

  public wake(): void {
    this.ensureContext();
    this.sync(this.currentVolumes, this.playing, this.muted);
  }

  public playSingingBowlChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.32, now + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
    master.connect(ctx.destination);

    // Tibetan singing bowl partials (warm 432Hz fundamental + inharmonic bell overtones)
    const partials = [
      { freq: 432, amp: 0.65, decay: 4.6 },
      { freq: 432 * 2.756, amp: 0.22, decay: 2.8 },
      { freq: 432 * 5.404, amp: 0.08, decay: 1.5 },
    ];

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);

      g.gain.setValueAtTime(p.amp, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + 5.0);
    });
  }
}

export const audioEngine = new AmbientAudioEngine();

/**
 * Audio Engine for Kaudi Game using Web Audio API
 * Generates organic procedural sounds:
 * - Shells shaking & scattering (multi-grain ceramic/wood clatter)
 * - Individual shell bounces with natural micro-variations
 * - Victory fanfare, bonus chimes, bank coin sound, and bust dull thud.
 */

class KaudiAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.7;
    this.isMuted = false;
    this.initFromStorage();
  }

  initFromStorage() {
    try {
      const storedMute = localStorage.getItem('kaudi_sound_muted');
      if (storedMute !== null) this.isMuted = storedMute === 'true';
      const storedVol = localStorage.getItem('kaudi_sound_vol');
      if (storedVol !== null) this.volume = parseFloat(storedVol) || 0.7;
    } catch (e) {}
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('kaudi_sound_muted', this.isMuted.toString());
    } catch (e) {}
    return this.isMuted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('kaudi_sound_vol', this.volume.toString());
    } catch (e) {}
  }

  // Shell Clatter & Scatter Sound (Toss)
  playToss() {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const count = 7 + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.28;
      this.scheduleShellClick(now + delay, 0.4 + Math.random() * 0.5, 900 + Math.random() * 1100);
    }
  }

  // Individual shell bouncing on wood/cloth
  playBounce(intensity = 0.5) {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freq = 1100 + Math.random() * 800;
    this.scheduleShellClick(now, intensity, freq);
  }

  scheduleShellClick(time, intensity, baseFreq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Cowrie shells produce a sharp, high-pitched ceramic-like transient
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, time + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, time);
    filter.Q.setValueAtTime(3.5, time);

    const clickVol = Math.max(0.01, intensity * this.volume * 0.35);
    gain.gain.setValueAtTime(clickVol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    // Noise burst for surface impact texture
    const bufferSize = this.ctx.sampleRate * 0.02;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1400, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(clickVol * 0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.06);
    whiteNoise.start(time);
    whiteNoise.stop(time + 0.03);
  }

  // Special Roll Chime (Ashta or Chhaka bonus)
  playBonus() {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.28 * this.volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  // Bust / Dull Turn Loss
  playBust() {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.35);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Bank Score Sound
  playBank() {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [659.25, 880.0];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.22 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Victory Celebration Fanfare
  playVictory() {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12 }, // C
      { f: 659.25, d: 0.12 }, // E
      { f: 783.99, d: 0.12 }, // G
      { f: 1046.5, d: 0.28 }, // C
      { f: 880.0,  d: 0.14 }, // A
      { f: 1046.5, d: 0.50 }  // C
    ];

    let t = now;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.32 * this.volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);

      t += note.d + 0.04;
    });
  }

  // Clean UI Click
  playClick() {
    if (this.isMuted || !this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

window.kaudiAudio = new KaudiAudio();

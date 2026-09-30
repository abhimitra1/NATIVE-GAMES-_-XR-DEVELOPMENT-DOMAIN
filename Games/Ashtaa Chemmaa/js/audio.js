/**
 * Ashtaa Chemmaa - Procedural Web Audio Engine
 * 
 * Provides crisp, zero-latency, 100% offline audio synthesis:
 * - Cowrie shell clatter & shake
 * - Wooden pawn slide & tap
 * - Capture strike & swoosh
 * - Ashta & Chamma royal fanfares
 * - Victory celebration fanfare
 * - Procedural ambient Indian tanpura drone
 * - Optional voice announcer via SpeechSynthesis
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.musicEnabled = false;
    this.voiceEnabled = true;
    this.volume = 0.7;
    this.ambientNodes = null;

    // Load saved preferences if any
    try {
      const savedMute = localStorage.getItem('ashtaa_mute');
      if (savedMute !== null) this.isMuted = JSON.parse(savedMute);
      const savedMusic = localStorage.getItem('ashtaa_music');
      if (savedMusic !== null) this.musicEnabled = JSON.parse(savedMusic);
      const savedVoice = localStorage.getItem('ashtaa_voice');
      if (savedVoice !== null) this.voiceEnabled = JSON.parse(savedVoice);
    } catch (e) {}
  }

  init() {
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

  // Helper to create main gain
  getMasterGain() {
    this.init();
    if (!this.ctx) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = this.isMuted ? 0 : this.volume;
    gain.connect(this.ctx.destination);
    return gain;
  }

  /**
   * Cowrie shell roll: clattering shells on polished wood
   */
  playRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;

    // Sequence of 4-6 ceramic shell clicks & clatters
    const clickCount = 6;
    for (let i = 0; i < clickCount; i++) {
      const delay = i * 0.05 + Math.random() * 0.03;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 + Math.random() * 1800, now + delay);
      filter.Q.setValueAtTime(8, now + delay);

      // Noise-like rapid modulation
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 1200, now + delay);
      osc.frequency.exponentialRampToValueAtTime(150, now + delay + 0.04);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.35, now + delay + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now + delay);
      osc.stop(now + delay + 0.07);
    }
  }

  /**
   * Piece movement hop / slide & wooden tap
   */
  playMove() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;

    // Woodblock tap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.1);

    // Subtle tactile high click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(1600, now);
    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    click.connect(clickGain);
    clickGain.connect(master);
    click.start(now);
    click.stop(now + 0.03);
  }

  /**
   * Dramatic capture sound: swoosh + martial impact
   */
  playCapture() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;

    // Low boom impact
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(220, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // High energetic strike
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(950, now);
    osc2.frequency.exponentialRampToValueAtTime(280, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now);
    osc2.stop(now + 0.2);
  }

  /**
   * Royal ASHTA (8) Fanfare
   */
  playAshta() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;
    // Ascending triumphal chord: D4, F#4, A4, D5
    const notes = [293.66, 369.99, 440.00, 587.33];

    notes.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.35, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + delay);
      osc.stop(now + delay + 0.5);
    });
  }

  /**
   * Sparkling CHAMMA (4) Fanfare
   */
  playChamma() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;
    // Bright bell chord: G4, B4, D5, G5
    const notes = [392.00, 493.88, 587.33, 783.99];

    notes.forEach((freq, idx) => {
      const delay = idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + delay);
      osc.stop(now + delay + 0.45);
    });
  }

  /**
   * Extra Turn notification cue
   */
  playExtraTurn() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;

    [523.25, 659.25].forEach((freq, i) => {
      const delay = i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  /**
   * Victory grand celebration fanfare
   */
  playWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;

    // Victory flourish sequence
    const notes = [
      { f: 392.00, d: 0.12, t: 0.0 },
      { f: 523.25, d: 0.12, t: 0.12 },
      { f: 659.25, d: 0.12, t: 0.24 },
      { f: 783.99, d: 0.40, t: 0.36 },
      { f: 659.25, d: 0.15, t: 0.78 },
      { f: 783.99, d: 0.65, t: 0.95 }
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0, now + n.t);
      gain.gain.linearRampToValueAtTime(0.4, now + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  /**
   * Tactile button click
   */
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const master = this.getMasterGain();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Procedural meditative Indian Tanpura Drone (toggleable ambient music)
   */
  startAmbientMusic() {
    if (!this.musicEnabled || this.isMuted) return;
    this.init();
    if (!this.ctx || this.ambientNodes) return;

    try {
      const rootGain = this.ctx.createGain();
      rootGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      rootGain.connect(this.ctx.destination);

      // Low D drone frequencies (D2, A2, D3, F#3)
      const freqs = [73.42, 110.00, 146.83, 185.00];
      const oscs = [];

      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320 + i * 40, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.15 / (i + 1), this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(rootGain);

        osc.start();
        oscs.push(osc);
      });

      this.ambientNodes = { rootGain, oscs };
    } catch (e) {
      console.warn('Ambient music failed to start:', e);
    }
  }

  stopAmbientMusic() {
    if (this.ambientNodes) {
      try {
        this.ambientNodes.oscs.forEach(osc => osc.stop());
      } catch (e) {}
      this.ambientNodes = null;
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem('ashtaa_music', JSON.stringify(this.musicEnabled));
    } catch (e) {}

    if (this.musicEnabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
    return this.musicEnabled;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('ashtaa_mute', JSON.stringify(this.isMuted));
    } catch (e) {}

    if (this.isMuted) {
      this.stopAmbientMusic();
    } else if (this.musicEnabled) {
      this.startAmbientMusic();
    }
    return this.isMuted;
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    try {
      localStorage.setItem('ashtaa_voice', JSON.stringify(this.voiceEnabled));
    } catch (e) {}
    return this.voiceEnabled;
  }

  speak(text) {
    if (!this.voiceEnabled || this.isMuted || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

const AudioService = new SoundEngine();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioService;
}

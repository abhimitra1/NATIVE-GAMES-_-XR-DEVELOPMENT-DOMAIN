/**
 * DAHDI (DHD) - PROCEDURAL WEB AUDIO SYNTHESIZER
 * Implements Design Bible Section 9: Wooden percussion, warm knocks,
 * resonant chimes, celebratory folk win/lose stings, and tanpura drone.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.isMuted = localStorage.getItem('dhd_muted') === 'true';
    this.sfxVolume = parseFloat(localStorage.getItem('dhd_sfx_vol') || '0.7');
    this.musicVolume = parseFloat(localStorage.getItem('dhd_music_vol') || '0.35');
    this.isDronePlaying = false;
    this.droneNodes = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateVolumes() {
    if (!this.ctx) return;
    const effectiveMute = this.isMuted ? 0 : 1;
    this.masterGain.gain.setValueAtTime(effectiveMute, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
  }

  setMute(mute) {
    this.isMuted = mute;
    localStorage.setItem('dhd_muted', mute);
    this.updateVolumes();
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('dhd_sfx_vol', this.sfxVolume);
    this.updateVolumes();
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('dhd_music_vol', this.musicVolume);
    this.updateVolumes();
  }

  // UI Tap: soft fingertip tap on lacquered wood (90ms)
  playTap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Piece Pickup: light wooden scrape and release (150ms)
  playPiecePickup() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(380, t + 0.12);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Piece Drop Valid: warm wooden knock on sandstone (200ms)
  playPieceDrop() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // Main knock body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    // Subtle high transient click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(1400, t);
    clickGain.gain.setValueAtTime(0.15, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    click.connect(clickGain);
    gain.connect(this.sfxGain);
    clickGain.connect(this.sfxGain);

    osc.start(t);
    click.start(t);
    osc.stop(t + 0.2);
    click.stop(t + 0.04);
  }

  // Piece Drop Invalid: dull muted wooden thud (180ms)
  playIllegal() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.16);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Piece Capture: quick click followed by sliding into tray (400ms)
  playCapture() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(550, t);
    click.frequency.exponentialRampToValueAtTime(180, t + 0.1);
    clickGain.gain.setValueAtTime(0.5, t);
    clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    // Slide/thunk
    const slide = this.ctx.createOscillator();
    const slideGain = this.ctx.createGain();
    slide.type = 'triangle';
    slide.frequency.setValueAtTime(220, t + 0.08);
    slide.frequency.exponentialRampToValueAtTime(90, t + 0.35);
    slideGain.gain.setValueAtTime(0.0, t);
    slideGain.gain.setValueAtTime(0.35, t + 0.08);
    slideGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    click.connect(clickGain);
    slide.connect(slideGain);
    clickGain.connect(this.sfxGain);
    slideGain.connect(this.sfxGain);

    click.start(t);
    click.stop(t + 0.12);
    slide.start(t + 0.08);
    slide.stop(t + 0.4);
  }

  // Mill Formed: Bright harmonious chime (bell-like)
  playMillChime() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 Indian Sa-Ga-Pa flourish

    freqs.forEach((freq, idx) => {
      const startTime = t + (idx * 0.06);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.75);
    });
  }

  // Win Sting: Folk triumph phrase (rising flute & tabla resonance)
  playWin() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Raga Bilawal triumph notes: Sa, Ga, Pa, Dha, High Sa
    const melody = [261.63, 329.63, 392.00, 440.00, 523.25];

    melody.forEach((freq, i) => {
      const noteStart = t + (i * 0.16);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.4, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteStart);
      osc.stop(noteStart + 0.4);
    });
  }

  // Lose Sting: Descending sitar phrase
  playLose() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const melody = [440.00, 392.00, 329.63, 261.63];

    melody.forEach((freq, i) => {
      const noteStart = t + (i * 0.22);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.3, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.005, noteStart + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteStart);
      osc.stop(noteStart + 0.45);
    });
  }

  // Ambient Indian Tanpura Drone: Pa-Sa harmonic meditation tone
  toggleDrone(enable) {
    this.ensureContext();
    if (!this.ctx) return;

    if (!enable && this.isDronePlaying) {
      this.droneNodes.forEach(node => {
        try { node.stop(); } catch (e) {}
      });
      this.droneNodes = [];
      this.isDronePlaying = false;
      return;
    }

    if (enable && !this.isDronePlaying) {
      const t = this.ctx.currentTime;
      const droneFreqs = [146.83, 220.00, 293.66, 440.00]; // D3, A3, D4, A4

      this.droneNodes = [];
      droneFreqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.08, t);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        this.droneNodes.push(osc);
      });

      this.isDronePlaying = true;
    }
  }
}

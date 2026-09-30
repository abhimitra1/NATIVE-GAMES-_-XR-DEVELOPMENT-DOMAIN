/**
 * SoundFX.js - Procedural Web Audio Sound Synthesizer for Chaupad
 * 
 * Generates all game sound effects algorithmically using the Web Audio API:
 * - Wooden stick dice tumbling & clattering (filtered white noise + tone blips)
 * - Wooden piece hops & taps
 * - Resonant brass capture chime
 * - Harmonious grace (चौ) fanfare
 * - Triumphant royal victory chords
 * 
 * 100% offline, zero external audio asset loading failures.
 */

export class SoundFX {
  constructor() {
    this.ac = null;
    this.enabled = true;
    try {
      this.enabled = localStorage.getItem('od-sound') !== 'off';
    } catch (e) {}
  }

  getAudioContext() {
    if (!this.ac) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ac = new AudioCtx();
    }
    if (this.ac && this.ac.state === 'suspended') {
      this.ac.resume().catch(() => {});
    }
    return this.ac;
  }

  blip(freq, dur, type = 'sine', vol = 0.1, when = 0) {
    if (!this.enabled) return;
    const a = this.getAudioContext();
    if (!a) return;
    try {
      const t = a.currentTime + when;
      const osc = a.createOscillator();
      const gain = a.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (e) {}
  }

  noise(dur, vol = 0.15, cutoff = 900, when = 0) {
    if (!this.enabled) return;
    const a = this.getAudioContext();
    if (!a) return;
    try {
      const t = a.currentTime + when;
      const sampleCount = Math.floor(a.sampleRate * dur);
      const buffer = a.createBuffer(1, sampleCount, a.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sampleCount, 2.4);
      }
      const source = a.createBufferSource();
      source.buffer = buffer;
      const filter = a.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      const gain = a.createGain();
      gain.gain.value = vol;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(a.destination);
      source.start(t);
    } catch (e) {}
  }

  click() {
    this.blip(660, 0.06, 'triangle', 0.1);
  }

  illegal() {
    this.blip(140, 0.16, 'sawtooth', 0.06);
  }

  roll() {
    this.blip(80, 0.1, 'square', 0.05);
    this.noise(0.07, 0.07, 500);
  }

  clack(when = 0) {
    this.noise(0.05, 0.2, 1300, when);
    this.blip(210, 0.05, 'triangle', 0.12, when);
  }

  hop() {
    this.blip(520, 0.08, 'sine', 0.08);
    this.blip(720, 0.06, 'sine', 0.06, 0.03);
  }

  capture() {
    this.noise(0.12, 0.18, 2200);
    this.blip(330, 0.14, 'square', 0.12);
    this.blip(550, 0.2, 'triangle', 0.14, 0.05);
  }

  grace() {
    this.blip(660, 0.12, 'triangle', 0.1);
    this.blip(880, 0.14, 'triangle', 0.12, 0.08);
    this.blip(1100, 0.2, 'triangle', 0.15, 0.16);
  }

  finish() {
    this.blip(784, 0.16, 'triangle', 0.1);
    this.blip(1047, 0.24, 'triangle', 0.12, 0.1);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => {
      this.blip(f, 0.22, 'triangle', 0.1, i * 0.14);
    });
  }
}

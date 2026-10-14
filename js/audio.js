// Lightweight Web Audio based SFX + simple voice-like tones for taunts
class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = 0.7;
    this.sfx = 0.8;
    this.voice = 0.9;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolumes(master, sfx, voice) {
    this.master = master;
    this.sfx = sfx;
    this.voice = voice;
  }

  _gain(type = 'sfx') {
    if (!this.ctx) return null;
    const g = this.ctx.createGain();
    const vol = (type === 'voice' ? this.voice : this.sfx) * this.master;
    g.gain.value = vol;
    g.connect(this.ctx.destination);
    return g;
  }

  // Simple synthesized SFX
  playTone(freq, duration, type = 'square', volScale = 1, destType = 'sfx') {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const g = this._gain(destType);
    if (!g) return;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(volScale * (destType === 'voice' ? this.voice : this.sfx) * this.master, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Attack whoosh – more powerful
  attack() {
    this.playTone(220 + Math.random() * 90, 0.11, 'sawtooth', 0.5);
    this.playTone(100, 0.09, 'square', 0.35);
    this.playTone(55, 0.14, 'triangle', 0.25);
  }

  // Magic cast – distinct per element
  cast(type) {
    const map = {
      dark: [80, 120, 0.22],
      fire: [240, 380, 0.2],
      water: [150, 280, 0.2],
      wind: [320, 480, 0.16],
      lightning: [480, 720, 0.14],
      earth: [60, 95, 0.28],
      antimagic: [100, 160, 0.2],
      spatial: [260, 400, 0.18]
    };
    const [base, high, dur] = map[type] || [160, 280, 0.18];
    this.playTone(base, dur, 'sine', 0.55);
    this.playTone(high, dur * 0.7, 'triangle', 0.35);
    this.playTone(base * 0.5, dur * 1.1, 'sawtooth', 0.2);
  }

  // Hit impact – heavier
  hit() {
    this.playTone(70 + Math.random() * 50, 0.09, 'square', 0.55);
    this.playTone(40, 0.12, 'triangle', 0.3);
  }

  // Enemy death – more satisfying
  death() {
    this.playTone(140, 0.2, 'sawtooth', 0.45);
    this.playTone(70, 0.3, 'triangle', 0.35);
    this.playTone(35, 0.4, 'sine', 0.25);
  }

  // Heal
  heal() {
    this.playTone(400, 0.2, 'sine', 0.35);
    this.playTone(600, 0.25, 'sine', 0.25);
  }

  // UI click
  click() {
    this.playTone(600, 0.06, 'square', 0.2);
  }

  // Level / important event
  fanfare() {
    this.playTone(262, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(330, 0.15, 'sine', 0.3), 120);
    setTimeout(() => this.playTone(392, 0.25, 'sine', 0.35), 240);
  }

  // Simple "voice" for taunts – short tonal patterns that feel speech-like
  taunt() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [180, 220, 160, 200, 140];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f + Math.random() * 20;
      g.gain.setValueAtTime(0.18 * this.voice * this.master, now + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.09);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.1);
    });
  }

  // Ryo style deeper voice pattern
  ryoSpeak() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [90, 110, 85, 100];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22 * this.voice * this.master, now + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.12);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.13);
    });
  }

  // Ambient low drone (optional continuous)
  startAmbient() {
    // Kept simple – can be expanded later
  }
}

const Audio = new GameAudio();

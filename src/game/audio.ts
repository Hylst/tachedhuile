const CHORDS = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 277.18, 329.63, 415.3],  // Amin7
  [246.94, 293.66, 349.23, 440.0], // Bmin7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
];

const ARPEGGIO = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOscs: OscillatorNode[] = [];
  private arpeggioInterval: number | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private chordIndex = 0;
  private arpIndex = 0;
  private started = false;

  isReady() {
    return !!this.ctx;
  }

  init() {
    if (this.ctx) return;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    const musicGain = ctx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(master);
    this.musicGain = musicGain;

    const sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.25;
    sfxGain.connect(master);
    this.sfxGain = sfxGain;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
      if (this.musicGain) this.fade(this.musicGain, 0, 0.3);
    } else if (this.ctx && !this.started) {
      this.startMusic();
    } else if (this.musicGain && this.ctx) {
      this.fade(this.musicGain, 0.12, 0.8);
    }
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  startMusic() {
    if (!this.ctx || !this.musicEnabled) return;
    this.stopMusic();
    this.started = true;
    this.playChord();
    this.scheduleChordChanges();
    this.scheduleArpeggio();
  }

  private fade(node: GainNode, to: number, durationSec: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    node.gain.cancelScheduledValues(ctx.currentTime);
    node.gain.linearRampToValueAtTime(to, ctx.currentTime + durationSec);
  }

  private playChord() {
    if (!this.ctx || !this.musicGain) return;
    this.musicOscs.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    this.musicOscs = [];

    const freqs = CHORDS[this.chordIndex];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.14 : 0.06, this.ctx!.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start();
      this.musicOscs.push(osc);
    });
  }

  private scheduleChordChanges() {
    if (this.arpeggioInterval === null) {
      this.arpeggioInterval = window.setInterval(() => {
        if (!this.musicEnabled) return;
        this.chordIndex = (this.chordIndex + 1) % CHORDS.length;
        this.playChord();
      }, 4800);
    }
  }

  private scheduleArpeggio() {
    const step = () => {
      if (!this.musicEnabled || !this.ctx || !this.sfxGain) return;
      const freq = ARPEGGIO[this.arpIndex % ARPEGGIO.length] * 2;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.018, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
      this.arpIndex++;
      setTimeout(step, 650);
    };
    step();
  }

  stopMusic() {
    this.musicOscs.forEach((o) => {
      try {
        o.stop();
      } catch {}
    });
    this.musicOscs = [];
    if (this.arpeggioInterval !== null) {
      clearInterval(this.arpeggioInterval);
      this.arpeggioInterval = null;
    }
    this.started = false;
  }

  playPick(colorIndex: number) {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const baseFreq = 220 + colorIndex * 55;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playWin() {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = this.ctx!.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  playLose() {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const notes = [392.0, 349.23, 293.66, 246.94, 196.0];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const t = this.ctx!.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  playHover(colorIndex: number) {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    const freq = 600 + colorIndex * 40;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playInvalid() {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCombo(level: number) {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const baseNote = 523.25;
    const note = baseNote * Math.pow(1.122, Math.min(level, 8));
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(note * 1.5, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playUndo() {
    if (!this.sfxEnabled || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

export const audio = new AudioManager();

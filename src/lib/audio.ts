let shared: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  try {
    if (!shared) shared = new Ctx();
    return shared;
  } catch {
    return null;
  }
}

export class AmbientEngine {
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer = 0;
  private step = 0;
  private notes: number[] = [];
  private volume = 0.6;
  private alive = false;

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master) this.master.gain.value = this.volume * 0.16;
  }

  play(notes: number[]): void {
    this.stop();
    const ctx = this.ensure();
    if (!ctx) return;
    this.notes = notes.length > 0 ? notes : [261.63];
    this.step = 0;
    this.alive = true;
    void ctx.resume();
    this.loop();
  }

  stop(): void {
    this.alive = false;
    window.clearTimeout(this.timer);
  }

  private ensure(): AudioContext | null {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (!this.master || !this.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      const master = ctx.createGain();
      master.gain.value = this.volume * 0.16;
      filter.connect(master);
      master.connect(ctx.destination);
      this.filter = filter;
      this.master = master;
    }
    return ctx;
  }

  private loop = (): void => {
    if (!this.alive || !this.filter) return;
    const freq = this.notes[this.step % this.notes.length] ?? 261.63;
    this.step += 1;
    this.tone(freq, 1.5, 0.07);
    if (this.step % this.notes.length === 1) this.tone((this.notes[0] ?? 261) / 2, 2.4, 0.035);
    this.timer = window.setTimeout(this.loop, 980);
  };

  private tone(freq: number, duration: number, peak: number): void {
    const ctx = getAudioContext();
    if (!ctx || !this.filter) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}

export function playChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + index * 0.12;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

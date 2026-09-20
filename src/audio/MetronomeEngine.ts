const LOOKAHEAD_S = 0.15; // how far ahead we schedule beeps
const TICK_MS = 25; // how often we check what to schedule

// The beep: a clean, gentle tone that fades out quickly.
const BEEP_HZ = 1000; // pitch of the beep, higher sounds sharper
const BEEP_LENGTH_S = 0.09; // how long the beep rings
const BEEP_LEVEL = 1.5; // loudness from 0 to 1

/** A simple metronome that plays a soft beep on every beat. */
export class MetronomeEngine {
  private context: AudioContext | null = null;
  private timerId = 0;
  private nextTime = 0;
  private bpm: number;

  constructor(bpm: number) {
    this.bpm = bpm;
  }

  /** Change the speed while playing. */
  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  async start(): Promise<void> {
    if (this.context) return;

    const context = new AudioContext();
    this.context = context;
    await context.resume();
    if (this.context !== context) return; // stopped while starting

    this.nextTime = context.currentTime + 0.05;
    this.timerId = window.setInterval(this.tick, TICK_MS);
  }

  stop(): void {
    window.clearInterval(this.timerId);
    const context = this.context;
    this.context = null;
    if (context) void context.close();
  }

  private tick = (): void => {
    const context = this.context;
    if (!context) return;
    while (this.nextTime < context.currentTime + LOOKAHEAD_S) {
      this.beep(context, this.nextTime);
      this.nextTime += 60 / this.bpm;
    }
  };

  private beep(context: AudioContext, time: number): void {
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = BEEP_HZ;

    // A very short fade in and a smooth fade out keep it soft, with no click.
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(BEEP_LEVEL, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + BEEP_LENGTH_S);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.onended = () => gain.disconnect();
    osc.start(time);
    osc.stop(time + BEEP_LENGTH_S + 0.02);
  }
}
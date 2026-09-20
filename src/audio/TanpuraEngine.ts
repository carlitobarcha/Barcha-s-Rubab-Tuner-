export type TanpuraTuning = 'Pa' | 'Ma' | 'Ni';

export interface TanpuraSettings {
  /** MIDI note number of the main (upper) Sa, e.g. 48 = C3 */
  saMidi: number;
  /** What the first string is tuned to */
  tuning: TanpuraTuning;
  /** Seconds between one string and the next */
  secondsPerString: number;
  /** 0 to 1 */
  volume: number;
}

// The first string is one octave below Pa, Ma or Ni.
const FIRST_STRING_OFFSET: Record<TanpuraTuning, number> = {
  Pa: 7 - 12,
  Ma: 5 - 12,
  Ni: 11 - 12,
};

const HARMONICS = 10;
const LOOKAHEAD_S = 0.25; // how far ahead we schedule plucks
const TICK_MS = 50; // how often we check what to schedule
const MASTER_LEVEL = 0.15;

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * A tanpura made from sine waves. It plucks four strings in a loop:
 * first string, Sa, Sa, then Sa an octave lower.
 */
export class TanpuraEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timerId = 0;
  private nextTime = 0;
  private step = 0;
  private settings: TanpuraSettings;

  constructor(settings: TanpuraSettings) {
    this.settings = settings;
  }

  /** Change sa, tuning, speed or volume while playing. */
  update(settings: TanpuraSettings): void {
    this.settings = settings;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(
        MASTER_LEVEL * settings.volume,
        this.context.currentTime,
        0.05,
      );
    }
  }

  async start(): Promise<void> {
    if (this.context) return;

    const context = new AudioContext();
    this.context = context;
    await context.resume();
    if (this.context !== context) return; // stopped while starting

    const compressor = context.createDynamicsCompressor();
    compressor.connect(context.destination);

    const master = context.createGain();
    master.gain.value = MASTER_LEVEL * this.settings.volume;
    master.connect(compressor);
    this.master = master;

    this.step = 0;
    this.nextTime = context.currentTime + 0.1;
    this.timerId = window.setInterval(this.tick, TICK_MS);
  }

  stop(): void {
    window.clearInterval(this.timerId);
    const context = this.context;
    if (context && this.master) {
      // Fade out, then close.
      this.master.gain.setTargetAtTime(0, context.currentTime, 0.08);
      window.setTimeout(() => void context.close(), 600);
    }
    this.context = null;
    this.master = null;
  }

  private tick = (): void => {
    const context = this.context;
    if (!context) return;
    while (this.nextTime < context.currentTime + LOOKAHEAD_S) {
      this.pluck(context, this.nextTime, this.step);
      this.nextTime += this.settings.secondsPerString;
      this.step = (this.step + 1) % 4;
    }
  };

  private pluck(context: AudioContext, time: number, step: number): void {
    if (!this.master) return;
    const { saMidi, tuning } = this.settings;
    const offsets = [FIRST_STRING_OFFSET[tuning], 0, 0, -12];
    const fundamental = midiToFrequency(saMidi + offsets[step]);

    for (let n = 1; n <= HARMONICS; n++) {
      const osc = context.createOscillator();
      osc.frequency.value = fundamental * n;

      // Higher harmonics swell in slowly and fade sooner, which gives
      // the shimmering buzz of a tanpura string.
      const peak = 1 / Math.pow(n, 0.9);
      const attack = 0.01 + (n - 1) * 0.02;
      const decay = 7 / (1 + 0.3 * (n - 1));

      const gain = context.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(peak, time + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, time + attack + decay);

      osc.connect(gain);
      gain.connect(this.master);
      osc.onended = () => gain.disconnect();
      osc.start(time);
      osc.stop(time + attack + decay + 0.05);
    }
  }
}
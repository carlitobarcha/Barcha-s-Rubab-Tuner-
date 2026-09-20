import type { PitchData } from '../types/tuner';
import { detectPitch } from '../utils/tunerMath';

const FFT_SIZE = 4096; // ~93 ms of audio at 44.1 kHz, good for low notes
const SILENCE_RMS = 0.01; // below this volume we treat it as silence
const MIN_CLARITY = 0.85; // ignore unclear/noisy detections

/** Called about 60 times a second. `null` means nothing clear is playing. */
type PitchCallback = (data: PitchData | null) => void;

export class AudioEngine {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer = new Float32Array(FFT_SIZE);
  private frameId = 0;
  private onPitch: PitchCallback;

  constructor(onPitch: PitchCallback) {
    this.onPitch = onPitch;
  }

  async start(): Promise<void> {
    if (this.context) return;

    // Turn off the browser's voice processing, it damages instrument sound.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.context = new AudioContext();
    await this.context.resume();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.context.createMediaStreamSource(this.stream).connect(this.analyser);

    this.loop();
  }

  stop(): void {
    cancelAnimationFrame(this.frameId);
    this.stream?.getTracks().forEach((track) => track.stop());
    void this.context?.close();
    this.stream = null;
    this.context = null;
    this.analyser = null;
    this.onPitch(null);
  }

  private loop = (): void => {
    if (!this.analyser || !this.context) return;

    this.analyser.getFloatTimeDomainData(this.buffer);

    let sumSquares = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSquares += this.buffer[i] * this.buffer[i];
    }
    const volume = Math.sqrt(sumSquares / this.buffer.length);

    if (volume < SILENCE_RMS) {
      this.onPitch(null);
    } else {
      const result = detectPitch(this.buffer, this.context.sampleRate);
      if (result && result.clarity >= MIN_CLARITY) {
        this.onPitch({ pitch: result.frequency, clarity: result.clarity, volume });
      } else {
        this.onPitch(null);
      }
    }

    this.frameId = requestAnimationFrame(this.loop);
  };
}

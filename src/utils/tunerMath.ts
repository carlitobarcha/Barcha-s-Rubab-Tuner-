export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/** Reference pitch for A4. Change this if you ever want A = 432, etc. */
export const A4 = 440;

const MIN_FREQ = 50; // Hz, lowest pitch we look for
const MAX_FREQ = 2000; // Hz, highest pitch we look for
const YIN_THRESHOLD = 0.15; // lower = stricter, fewer false detections

export interface NoteReading {
  /** Note name without octave, e.g. "C#" */
  note: string;
  /** Octave number, e.g. 4 for A4 */
  octave: number;
  /** 0 = C, 1 = C#, ... 11 = B */
  noteIndex: number;
  /** How far from the exact note, in cents (-50 to +50) */
  cents: number;
  /** Exact frequency of the nearest note in Hz */
  targetFreq: number;
}

export function frequencyToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / A4);
}

/** Turns a frequency in Hz into the nearest chromatic note. */
export function getNoteReading(freq: number): NoteReading {
  const midi = frequencyToMidi(freq);
  const nearest = Math.round(midi);
  const noteIndex = ((nearest % 12) + 12) % 12;
  return {
    note: NOTE_NAMES[noteIndex],
    octave: Math.floor(nearest / 12) - 1,
    noteIndex,
    cents: (midi - nearest) * 100,
    targetFreq: A4 * Math.pow(2, (nearest - 69) / 12),
  };
}

export interface DetectedPitch {
  frequency: number;
  /** 0 to 1, how clean/periodic the sound is */
  clarity: number;
}

/**
 * YIN pitch detection. Takes a block of audio samples and returns the
 * fundamental frequency, or null if no clear pitch is found.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
): DetectedPitch | null {
  const half = Math.floor(buffer.length / 2);
  const minTau = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
  const maxTau = Math.min(half - 2, Math.floor(sampleRate / MIN_FREQ));

  // Step 1 and 2: difference function with cumulative mean normalisation
  const cmnd = new Float32Array(maxTau + 2);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau + 1; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    runningSum += sum;
    cmnd[tau] = runningSum === 0 ? 1 : (sum * tau) / runningSum;
  }

  // Step 3: first dip below the threshold, then walk down to its bottom
  let found = -1;
  for (let tau = minTau; tau <= maxTau; tau++) {
    if (cmnd[tau] < YIN_THRESHOLD) {
      while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) tau++;
      found = tau;
      break;
    }
  }
  if (found === -1) return null;

  // Step 4: parabolic interpolation for sub-sample accuracy
  const s0 = cmnd[found - 1];
  const s1 = cmnd[found];
  const s2 = cmnd[found + 1];
  const denom = 2 * (s0 - 2 * s1 + s2);
  const refined = denom !== 0 ? found + (s0 - s2) / denom : found;

  return {
    frequency: sampleRate / refined,
    clarity: Math.max(0, Math.min(1, 1 - s1)),
  };
}

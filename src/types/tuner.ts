export interface PitchData {
  pitch: number;
  clarity: number;
  volume: number;
}

export interface RubabString {
  id: string;
  name: string;
  type: 'main' | 'tarab';
  targetFreq: number;
  noteName: string;
}

export interface RaagPreset {
  id: string;
  name: string;
  description: string;
  strings: RubabString[];
}

export interface NoteInfo {
  note: string;
  targetFreq: number;
  cents: number;
}
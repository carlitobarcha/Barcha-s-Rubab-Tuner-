import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { AudioEngine } from './audio/AudioEngine';
import AboutRubab from './components/AboutRubab';
import PitchTrace from './components/PitchTrace';
import RaagPanel from './components/RaagPanel';
import TanpuraPanel from './components/TanpuraPanel';
import { RAAGS, SWARA_LABELS, getLaneInfo } from './constants/raags';
import { getNoteReading } from './utils/tunerMath';
import type { NoteReading } from './utils/tunerMath';
import type { PitchData } from './types/tuner';

const APP_NAME = 'Rubab Tuner';

interface Reading extends NoteReading {
  frequency: number;
}

const READOUT_INTERVAL_MS = 80; // how often the big numbers refresh
const HOLD_MS = 500; // after this much silence the readout is dimmed

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [sounding, setSounding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saNote, setSaNote] = useState(0); // 0 = C ... 11 = B
  const [raagId, setRaagId] = useState<string | null>(null);

  const engineRef = useRef<AudioEngine | null>(null);
  const latestFreqRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const lastHeardRef = useRef(0);

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  const handlePitch = useCallback((data: PitchData | null) => {
    const now = performance.now();
    latestFreqRef.current = data ? data.pitch : null;
    if (data) lastHeardRef.current = now;

    if (now - lastUpdateRef.current < READOUT_INTERVAL_MS) return;
    lastUpdateRef.current = now;

    // The last note stays on screen; it is only dimmed once sound stops.
    if (data) {
      setReading({ ...getNoteReading(data.pitch), frequency: data.pitch });
    }
    setSounding(now - lastHeardRef.current <= HOLD_MS);
  }, []);

  const getFrequency = useCallback(() => latestFreqRef.current, []);

  const toggleMic = async () => {
    if (isListening) {
      engineRef.current?.stop();
      engineRef.current = null;
      setIsListening(false);
      setSounding(false);
      return;
    }
    try {
      setError(null);
      const engine = new AudioEngine(handlePitch);
      await engine.start();
      engineRef.current = engine;
      setIsListening(true);
    } catch {
      setError(
        'Could not open the microphone. Allow microphone access in your browser and try again.',
      );
    }
  };

  // Release the microphone if the page is closed or reloaded.
  useEffect(() => {
    return () => engineRef.current?.stop();
  }, []);

  const raag = RAAGS.find((r) => r.id === raagId) ?? null;
  const lanes = useMemo(() => getLaneInfo(raag, saNote), [raag, saNote]);

  const cents = reading ? Math.round(reading.cents) : 0;
  const centsText = cents > 0 ? `+${cents}` : `${cents}`;

  // Where the played note sits in the chosen raag.
  let raagText: string | null = null;
  let inRaag = false;
  if (reading && raag) {
    const semitone = (reading.noteIndex - saNote + 12) % 12;
    inRaag = raag.semitones.includes(semitone);
    raagText = inRaag
      ? `${SWARA_LABELS[semitone]} · in ${raag.name}`
      : `${SWARA_LABELS[semitone]} · not in ${raag.name}`;
  }

  return (
    <div className="app">
      <div className="app-top">
        <div>
          <h1 className="app-title">{APP_NAME}</h1>
          <p className="app-credit">A product by Khalid Barcha</p>
        </div>
        <AboutRubab />
      </div>

      <div className="app-body">
        <main className="tuner">
          <header className={sounding ? 'readout' : 'readout readout-idle'}>
            <div className="readout-note">
              {reading ? (
                <>
                  {reading.note}
                  <sub>{reading.octave}</sub>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="readout-detail">
              <span>
                {reading ? `${reading.frequency.toFixed(1)} Hz` : 'Play a note'}
              </span>
              {reading && (
                <span className={Math.abs(cents) <= 5 ? 'in-tune' : ''}>
                  {centsText} cents
                </span>
              )}
              {raagText && (
                <span className={inRaag ? 'in-tune' : 'off-raag'}>{raagText}</span>
              )}
            </div>
          </header>

          <PitchTrace
            getFrequency={getFrequency}
            active={isListening}
            lanes={lanes}
          />

          <footer className="controls">
            {error && <p className="error">{error}</p>}
            <button type="button" onClick={toggleMic}>
              {isListening ? 'Stop listening' : 'Start listening'}
            </button>
          </footer>
        </main>

        <aside className="side">
          <RaagPanel
            saNote={saNote}
            onSaChange={setSaNote}
            raagId={raagId}
            onRaagChange={setRaagId}
          />
          <TanpuraPanel saNote={saNote} />
        </aside>
      </div>
    </div>
  );
}
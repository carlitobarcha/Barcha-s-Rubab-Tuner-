import { useEffect, useMemo, useRef, useState } from 'react';
import { TanpuraEngine } from '../audio/TanpuraEngine';
import type { TanpuraTuning } from '../audio/TanpuraEngine';

interface TanpuraPanelProps {
  /** Which note is Sa: 0 = C ... 11 = B */
  saNote: number;
}

const SA_BASE_MIDI = 48; // Sa sits in the third octave (C3 is about 131 Hz)
const TUNINGS: TanpuraTuning[] = ['Pa', 'Ma', 'Ni'];

export default function TanpuraPanel({ saNote }: TanpuraPanelProps) {
  const [playing, setPlaying] = useState(false);
  const [tuning, setTuning] = useState<TanpuraTuning>('Pa');
  const [secondsPerString, setSecondsPerString] = useState(1.3);
  const [volume, setVolume] = useState(0.6);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<TanpuraEngine | null>(null);

  const settings = useMemo(
    () => ({
      saMidi: SA_BASE_MIDI + saNote,
      tuning,
      secondsPerString,
      volume,
    }),
    [saNote, tuning, secondsPerString, volume],
  );

  // Send changes to the running tanpura.
  useEffect(() => {
    engineRef.current?.update(settings);
  }, [settings]);

  // Stop the tanpura if the page is closed or reloaded.
  useEffect(() => {
    return () => engineRef.current?.stop();
  }, []);

  const toggle = async () => {
    if (playing) {
      engineRef.current?.stop();
      engineRef.current = null;
      setPlaying(false);
      return;
    }
    try {
      setError(null);
      const engine = new TanpuraEngine(settings);
      await engine.start();
      engineRef.current = engine;
      setPlaying(true);
    } catch {
      setError('Could not start the sound. Try clicking the button again.');
    }
  };

  return (
    <section className="panel">
      <h2 className="panel-title">Tanpura</h2>

      <h3 className="panel-label">First string</h3>
      <div className="chips">
        {TUNINGS.map((t) => (
          <button
            type="button"
            key={t}
            className="chip"
            aria-pressed={tuning === t}
            onClick={() => setTuning(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="slider">
        <span className="panel-label">Gap between strings: {secondsPerString.toFixed(1)} s</span>
        <input
          type="range"
          min={0.8}
          max={2.2}
          step={0.1}
          value={secondsPerString}
          onChange={(e) => setSecondsPerString(Number(e.target.value))}
        />
      </label>

      <label className="slider">
        <span className="panel-label">Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </label>

      {error && <p className="error">{error}</p>}
      <button type="button" className="panel-button" onClick={toggle}>
        {playing ? 'Stop tanpura' : 'Play tanpura'}
      </button>
      <p className="panel-hint">
        The tanpura plays on the Sa you chose in the Raag section. Use
        headphones, or the tuner will hear the tanpura too.
      </p>
    </section>
  );
}

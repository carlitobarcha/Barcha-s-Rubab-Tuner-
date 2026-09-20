import { useEffect, useRef, useState } from 'react';
import { MetronomeEngine } from '../audio/MetronomeEngine';

const MIN_BPM = 30;
const MAX_BPM = 240;
const START_BPM = 80;
const HOLD_DELAY_MS = 400; // how long to hold before the number keeps changing
const HOLD_REPEAT_MS = 80; // how fast it changes while you hold

function clamp(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
}

export default function MetronomePanel() {
  const [bpm, setBpm] = useState(START_BPM);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const holdRef = useRef({ delay: 0, repeat: 0 });

  // Send the new speed to the running metronome.
  useEffect(() => {
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  const stopHold = () => {
    window.clearTimeout(holdRef.current.delay);
    window.clearInterval(holdRef.current.repeat);
  };

  const change = (delta: number) => setBpm((current) => clamp(current + delta));

  // Tap once to change by 1. Hold to keep changing.
  const startHold = (delta: number) => {
    stopHold();
    change(delta);
    holdRef.current.delay = window.setTimeout(() => {
      holdRef.current.repeat = window.setInterval(() => change(delta), HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  };

  // Stop everything if the page is closed or reloaded.
  useEffect(() => {
    return () => {
      window.clearTimeout(holdRef.current.delay);
      window.clearInterval(holdRef.current.repeat);
      engineRef.current?.stop();
    };
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
      const engine = new MetronomeEngine(bpm);
      await engine.start();
      engineRef.current = engine;
      setPlaying(true);
    } catch {
      setError('Could not start the sound. Try clicking the button again.');
    }
  };

  const stepButton = (label: string, symbol: string, delta: number) => (
    <button
      type="button"
      className="metro-step"
      aria-label={label}
      onPointerDown={() => startHold(delta)}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          change(delta);
        }
      }}
    >
      {symbol}
    </button>
  );

  return (
    <section className="panel">
      <h2 className="panel-title">Metronome</h2>

      <div className="metro-row">
        {stepButton('Slower', '−', -1)}
        <div className="metro-bpm" aria-live="polite">
          <span className="metro-value">{bpm}</span>
          <span className="metro-unit">BPM</span>
        </div>
        {stepButton('Faster', '+', 1)}
      </div>

      {error && <p className="error">{error}</p>}
      <button type="button" className="panel-button" onClick={toggle}>
        {playing ? 'Stop metronome' : 'Play metronome'}
      </button>
      <p className="panel-hint">
        Tap + or − to change by one, or hold to change faster. Use headphones,
        or the tuner will hear the clicks.
      </p>
    </section>
  );
}
import { NOTE_NAMES } from '../utils/tunerMath';
import { RAAGS, SWARA_LABELS } from '../constants/raags';

interface RaagPanelProps {
  /** Which note is Sa: 0 = C ... 11 = B */
  saNote: number;
  onSaChange: (note: number) => void;
  /** Selected raag id, or null for plain chromatic */
  raagId: string | null;
  onRaagChange: (id: string | null) => void;
}

export default function RaagPanel({
  saNote,
  onSaChange,
  raagId,
  onRaagChange,
}: RaagPanelProps) {
  const raag = RAAGS.find((r) => r.id === raagId) ?? null;

  return (
    <section className="panel">
      <h2 className="panel-title">Raag</h2>

      <h3 className="panel-label">Sa (base note)</h3>
      <div className="chips">
        {NOTE_NAMES.map((name, index) => (
          <button
            type="button"
            key={name}
            className="chip"
            aria-pressed={saNote === index}
            onClick={() => onSaChange(index)}
          >
            {name}
          </button>
        ))}
      </div>

      <h3 className="panel-label">Choose a raag</h3>
      <div className="chips">
        <button
          type="button"
          className="chip"
          aria-pressed={raag === null}
          onClick={() => onRaagChange(null)}
        >
          None
        </button>
        {RAAGS.map((r) => (
          <button
            type="button"
            key={r.id}
            className="chip"
            aria-pressed={raagId === r.id}
            onClick={() => onRaagChange(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>

      {raag && (
        <div className="raag-notes">
          <h3 className="panel-label">{raag.name} notes</h3>
          <ul className="swara-list">
            {[...raag.semitones]
              .sort((a, b) => a - b)
              .map((semitone) => (
                <li key={semitone} className="swara">
                  <span className="swara-name">{SWARA_LABELS[semitone]}</span>
                  <span className="swara-note">
                    {NOTE_NAMES[(saNote + semitone) % 12]}
                  </span>
                </li>
              ))}
          </ul>
           <p className="raag-description">{raag.description}</p>
          <p className="panel-hint">
            Lowercase is komal (flat). MA is tivra (sharp Ma). Notes outside
            the raag are dimmed on the tuner.
          </p>
        </div>
      )}
    </section>
  );
}

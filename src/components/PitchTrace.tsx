import { useEffect, useRef } from 'react';
import { NOTE_NAMES, getNoteReading } from '../utils/tunerMath';
import type { LaneInfo } from '../constants/raags';

interface PitchTraceProps {
  /** Returns the latest detected frequency in Hz, or null for silence. */
  getFrequency: () => number | null;
  /** The trace only scrolls while this is true. */
  active: boolean;
  /** Look of each note lane (index 0 = C ... 11 = B). */
  lanes: LaneInfo[];
}

const TRACE_SECONDS = 10; // time a note takes to cross the screen and disappear
const MAX_FRAME_S = 0.25; // ignore long pauses (for example a background tab)

function noteColor(noteIndex: number): string {
  return `hsl(${(noteIndex * 30 + 70) % 360} 95% 60%)`;
}

export default function PitchTrace({ getFrequency, active, lanes }: PitchTraceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getFrequencyRef = useRef(getFrequency);
  useEffect(() => {
    getFrequencyRef.current = getFrequency;
  }, [getFrequency]);

  // Keep the canvas pixel size in sync with its on-screen size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Draw loop: while listening, time keeps moving. The trace scrolls left at a
  // steady speed, and the newest pitch (if any) is painted at the right edge.
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frameId = 0;
    let lastTime = performance.now();
    let pendingPx = 0; // fractions of a pixel carried over between frames

    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      // Real-time scrolling: the whole width takes TRACE_SECONDS to cross.
      const elapsed = Math.min((now - lastTime) / 1000, MAX_FRAME_S);
      lastTime = now;
      pendingPx += (w / TRACE_SECONDS) * elapsed;
      const shift = Math.floor(pendingPx);
      pendingPx -= shift;

      if (shift > 0) {
        ctx.globalCompositeOperation = 'copy';
        ctx.drawImage(canvas, -shift, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(w - shift, 0, shift, h);
      }

      const freq = getFrequencyRef.current();
      if (freq !== null) {
        const { noteIndex, cents } = getNoteReading(freq);
        // 12 lanes, C at the bottom. Position = note lane + cents offset.
        const lane = noteIndex + cents / 100;
        const y = h - ((lane + 0.5) / 12) * h;
        const color = noteColor(noteIndex);
        const dotWidth = Math.max(shift, 1) + 1;

        ctx.shadowBlur = 14 * dpr;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(w - dotWidth, y - 2 * dpr, dotWidth, 4 * dpr);
        ctx.shadowBlur = 0;
      }
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [active]);

  // Lanes are listed top to bottom, so B is first and C is last.
  const rows = NOTE_NAMES.map((name, noteIndex) => ({ name, noteIndex })).reverse();

  return (
    <div className="trace">
      <div className="trace-lanes">
        {rows.map(({ name, noteIndex }) => {
          const info = lanes[noteIndex];
          const classes = ['trace-lane'];
          if (info?.dimmed) classes.push('is-dim');
          if (info?.isSa) classes.push('is-sa');
          return (
            <div className={classes.join(' ')} key={name}>
              <span className="trace-label">
                <span className="trace-note">{name}</span>
                <span className="trace-swara">{info?.swara ?? ''}</span>
              </span>
              <span className="trace-line" />
            </div>
          );
        })}
      </div>
      <canvas className="trace-canvas" ref={canvasRef} />
    </div>
  );
}
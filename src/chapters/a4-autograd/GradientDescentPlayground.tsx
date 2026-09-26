import { useEffect, useMemo, useRef, useState } from 'react';
import { Figure, Segmented, Slider } from '../../components';
import styles from './widgets.module.css';

/**
 * A ball on a 1-D loss curve. Each step computes the slope (gradient) at the
 * ball and moves w by −lr·slope. Too small a learning rate crawls; too big
 * overshoots and, past a point, diverges.
 */

type CurveKey = 'bowl' | 'bumpy';

interface Curve {
  f: (w: number) => number;
  df: (w: number) => number;
  wRange: [number, number];
  start: number;
}

const CURVES: Record<CurveKey, Curve> = {
  bowl: {
    f: (w) => (w - 3) ** 2,
    df: (w) => 2 * (w - 3),
    wRange: [-2, 8],
    start: 0,
  },
  bumpy: {
    f: (w) => 0.15 * (w - 3.2) ** 2 + 1.3 * Math.sin(1.5 * w) + 1.5,
    df: (w) => 0.3 * (w - 3.2) + 1.95 * Math.cos(1.5 * w),
    wRange: [-2, 8],
    start: -1.6,
  },
};

const W = 400;
const H = 230;
const PAD_L = 34;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 28;

function fmt(v: number): string {
  if (!Number.isFinite(v)) return '∞';
  const a = Math.abs(v);
  if (a < 0.0005) return '0.000';
  if (a >= 1000) return v.toExponential(1);
  return v.toFixed(a >= 100 ? 1 : a >= 10 ? 2 : 3);
}

export function GradientDescentPlayground() {
  const [curveKey, setCurveKey] = useState<CurveKey>('bowl');
  const [lr, setLr] = useState(0.1);
  const [history, setHistory] = useState<number[]>([CURVES.bowl.start]);
  const [playing, setPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const curve = CURVES[curveKey];
  const [w0, w1] = curve.wRange;

  // Sample the curve once per curve: plot path, y-range and global minimum.
  const { path, yMax, minW, minLoss } = useMemo(() => {
    const n = 240;
    const xs = Array.from({ length: n + 1 }, (_, i) => w0 + ((w1 - w0) * i) / n);
    const ys = xs.map(curve.f);
    const top = Math.max(...ys) * 1.08;
    const iMin = ys.indexOf(Math.min(...ys));
    const sxL = (x: number) => PAD_L + ((x - w0) / (w1 - w0)) * (W - PAD_L - PAD_R);
    const syL = (y: number) => PAD_T + (1 - y / top) * (H - PAD_T - PAD_B);
    const d = xs.map((x, i) => `${i ? 'L' : 'M'}${sxL(x).toFixed(1)},${syL(ys[i]).toFixed(1)}`).join(' ');
    return { path: d, yMax: top, minW: xs[iMin], minLoss: ys[iMin] };
  }, [curve, w0, w1]);

  const sx = (x: number) => PAD_L + ((x - w0) / (w1 - w0)) * (W - PAD_L - PAD_R);
  const sy = (y: number) => PAD_T + (1 - y / yMax) * (H - PAD_T - PAD_B);
  const clampX = (x: number) => Math.min(w1, Math.max(w0, x));
  const clampY = (y: number) => Math.min(yMax, Math.max(0, y));

  const w = history[history.length - 1];
  const loss = curve.f(w);
  const grad = curve.df(w);
  const offChart = w < w0 || w > w1;
  const diverged = !Number.isFinite(w) || Math.abs(w - minW) > 40;
  const converged = !diverged && Math.abs(grad) < 0.005;
  const stepCount = history.length - 1;

  const step = () => setHistory((h) => {
    const cur = h[h.length - 1];
    return [...h, cur - lr * curve.df(cur)];
  });

  // Autoplay: one step every 450 ms until converged or diverged.
  useEffect(() => {
    if (!playing) return;
    if (diverged || converged || stepCount >= 200) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(step, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, history, diverged, converged]);

  const reset = (key: CurveKey = curveKey) => {
    setPlaying(false);
    setHistory([CURVES[key].start]);
  };

  // Tap the plot to drop the ball somewhere else: on the bumpy curve, try starting just right of the first hump.
  const place = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const x = w0 + ((px - PAD_L) / (W - PAD_L - PAD_R)) * (w1 - w0);
    setPlaying(false);
    setHistory([Math.round(clampX(x) * 10) / 10]);
  };

  // Tangent segment of fixed on-screen length through the ball.
  const kx = (W - PAD_L - PAD_R) / (w1 - w0);
  const ky = (H - PAD_T - PAD_B) / yMax;
  const dxs = kx;
  const dys = -grad * ky;
  const len = Math.hypot(dxs, dys) || 1;
  const T = 46;
  const bx = sx(clampX(w));
  const by = sy(clampY(loss));

  const next = w - lr * grad;
  const prev = history.length > 1 ? history[history.length - 2] : undefined;

  let message: string;
  let tone: 'danger' | 'good' | undefined;
  if (diverged) {
    message = 'Diverged! Every step overshoots further than the last. Lower the learning rate and press Reset.';
    tone = 'danger';
  } else if (converged) {
    if (loss > minLoss + 0.3) {
      message = 'Stuck in a dip: the slope is 0 here, so the steps stop, but this is not the lowest point.';
    } else {
      message = `Converged in ${stepCount} steps: the slope is ≈ 0, so each step is now tiny.`;
      tone = 'good';
    }
  } else if (prev === undefined) {
    message = 'Press Step. The orange line is the slope at the ball; the ball moves the opposite way (downhill).';
  } else if (curve.f(w) > curve.f(prev)) {
    message = 'The loss went up: the step jumped past the bottom and landed higher. The learning rate is too big.';
    tone = 'danger';
  } else if (Math.sign(curve.df(prev)) !== Math.sign(grad)) {
    message = 'Overshot: the ball crossed the bottom and the slope flipped sign. It will zig-zag back.';
  } else {
    message = `Slope was ${fmt(curve.df(prev))}, so w moved by −lr × slope = ${fmt(w - prev)}.`;
  }

  return (
    <Figure
      title="Gradient descent playground"
      caption="The blue curve is the loss for every value of one parameter w. At each step we measure the slope at the ball and move w a little against it. Try a learning rate of 0.01 (slow), 0.1 (good), 0.9 (zig-zag) and 1.15 (diverges). Tap the plot to drop the ball somewhere else: on the bumpy curve, try starting just right of the first hump."
    >
      <Segmented
        options={[
          { value: 'bowl', label: 'Smooth bowl' },
          { value: 'bumpy', label: 'Bumpy curve' },
        ]}
        value={curveKey}
        onChange={(k) => {
          setCurveKey(k);
          reset(k);
        }}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`Loss curve with the ball at w = ${fmt(w)}, loss ${fmt(loss)}`}
        onPointerDown={place}
      >
        <line x1={PAD_L} x2={W - PAD_R} y1={H - PAD_B} y2={H - PAD_B} className={styles.axis} />
        <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={H - PAD_B} className={styles.axis} />
        {[-2, 0, 2, 4, 6, 8].map((t) => (
          <text key={t} x={sx(t)} y={H - 10} className={styles.tick} textAnchor="middle">
            {t}
          </text>
        ))}
        <text x={W - PAD_R} y={H - PAD_B - 6} className={styles.tick} textAnchor="end">
          w
        </text>
        <text x={PAD_L - 6} y={PAD_T + 8} className={styles.tick} textAnchor="end">
          loss
        </text>
        <line x1={sx(minW)} x2={sx(minW)} y1={sy(minLoss)} y2={H - PAD_B} className={styles.minMark} />

        <path d={path} className={styles.curve} />

        {/* where the ball has been */}
        {history.slice(0, -1).map((hw, i) => {
          if (!Number.isFinite(hw)) return null;
          const a = { x: sx(clampX(hw)), y: sy(clampY(curve.f(hw))) };
          const nw = history[i + 1];
          const b = { x: sx(clampX(nw)), y: sy(clampY(curve.f(nw))) };
          const midY = Math.min(a.y, b.y) - 18;
          return (
            <g key={i}>
              <path d={`M${a.x},${a.y} Q${(a.x + b.x) / 2},${midY} ${b.x},${b.y}`} className={styles.jump} />
              <circle cx={a.x} cy={a.y} r={3.5} className={styles.trailDot} />
            </g>
          );
        })}

        {!diverged && !offChart && (
          <>
            <line
              x1={bx - (dxs / len) * T}
              y1={by - (dys / len) * T}
              x2={bx + (dxs / len) * T}
              y2={by + (dys / len) * T}
              className={styles.tangent}
            />
            {!converged && next >= w0 && next <= w1 && (
              <circle
                cx={sx(next)}
                cy={sy(clampY(curve.f(next)))}
                r={6}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            )}
          </>
        )}
        <circle cx={bx} cy={by} r={8} className={styles.ball} />
        {offChart && (
          <text x={bx + (w > w1 ? -12 : 12)} y={by + 22} className={styles.tick} textAnchor={w > w1 ? 'end' : 'start'}>
            off the chart {w > w1 ? '→' : '←'}
          </text>
        )}
      </svg>

      <div className={`${styles.readouts} ${styles.readouts4}`}>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>w</span>
          <span className={styles.readoutValue}>{fmt(w)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>loss</span>
          <span className={styles.readoutValue}>{fmt(loss)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>gradient</span>
          <span className={styles.readoutValue}>{fmt(grad)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>steps</span>
          <span className={styles.readoutValue}>{stepCount}</span>
        </div>
      </div>

      <div className={styles.banner} data-tone={tone} aria-live="polite">
        {message}
      </div>

      <div className={styles.controls}>
        <Slider label="Learning rate (lr)" min={0.01} max={1.2} step={0.01} value={lr} onChange={setLr} format={(v) => v.toFixed(2)} />
        <div className={styles.buttonRow}>
          <button className={styles.button} onClick={step} disabled={diverged || playing}>
            Step
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={() => setPlaying((p) => !p)}
            disabled={diverged || converged}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button className={styles.button} onClick={() => reset()}>
            Reset
          </button>
        </div>
      </div>
    </Figure>
  );
}

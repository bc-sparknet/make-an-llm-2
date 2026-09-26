import { useMemo } from 'react';
import { Figure, StepControls, useStepper } from '../../components';
import styles from './widgets.module.css';

/**
 * Fits y = w·x + b to six points with plain gradient descent (the same data,
 * starting point and learning rate as the Python example in the chapter).
 * Each frame shows the line, the errors, the two gradients and the loss so far.
 */

const XS = [0, 1, 2, 3, 4, 5];
const YS = [1.2, 2.8, 5.1, 7.3, 8.7, 11.2];
const LR = 0.02;
const STEPS = 300;
const FRAMES = [0, 1, 2, 3, 4, 5, 6, 8, 10, 13, 16, 20, 25, 30, 40, 50, 65, 80, 100, 130, 160, 200, 250, 300];

interface State {
  w: number;
  b: number;
  loss: number;
  gw: number;
  gb: number;
}

/** Mean squared error and its gradients, worked out by hand (the chain rule). */
function evaluate(w: number, b: number): State {
  const n = XS.length;
  let loss = 0;
  let gw = 0;
  let gb = 0;
  XS.forEach((x, i) => {
    const err = w * x + b - YS[i];
    loss += err * err;
    gw += 2 * err * x;
    gb += 2 * err;
  });
  return { w, b, loss: loss / n, gw: gw / n, gb: gb / n };
}

function run(): State[] {
  const out: State[] = [];
  let w = 0;
  let b = 0;
  for (let s = 0; s <= STEPS; s++) {
    const st = evaluate(w, b);
    out.push(st);
    w -= LR * st.gw;
    b -= LR * st.gb;
  }
  return out;
}

const W = 400;
const H = 220;
const PAD_L = 30;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;
const X_RANGE: [number, number] = [-0.4, 5.4];
const Y_RANGE: [number, number] = [-1, 13];
const sx = (x: number) => PAD_L + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (W - PAD_L - PAD_R);
const sy = (y: number) => PAD_T + (1 - (y - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (H - PAD_T - PAD_B);

const SW = 400;
const SH = 64;

const f2 = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3));

export function LineFitAnimation() {
  const history = useMemo(run, []);
  const stepper = useStepper(FRAMES.length, 700);
  const stepNo = FRAMES[stepper.step];
  const st = history[stepNo];

  // Loss sparkline on a log scale: the loss drops by ~1000× so linear would hide the tail.
  const logs = history.map((h) => Math.log10(h.loss));
  const lo = Math.min(...logs);
  const hi = Math.max(...logs);
  const px = (s: number) => 4 + (s / STEPS) * (SW - 8);
  const py = (l: number) => 6 + (1 - (l - lo) / (hi - lo)) * (SH - 12);
  const sparkPath = (upTo: number) =>
    logs
      .slice(0, upTo + 1)
      .map((l, s) => `${s ? 'L' : 'M'}${px(s).toFixed(1)},${py(l).toFixed(1)}`)
      .join(' ');

  const lineAt = (x: number) => st.w * x + st.b;
  const clipY = (y: number) => Math.min(Y_RANGE[1], Math.max(Y_RANGE[0], y));

  return (
    <Figure
      title="Fitting a line by gradient descent"
      caption="Red dashes are the errors. The loss is their average squared length. Both gradients start large and negative (the line is far too low, so increasing w and b lowers the loss), then shrink toward 0 as the line settles near w ≈ 2, b ≈ 1."
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={`Line y = ${f2(st.w)}x + ${f2(st.b)} through six points`}>
        <line x1={PAD_L} x2={W - PAD_R} y1={sy(0)} y2={sy(0)} className={styles.axis} />
        <line x1={sx(0)} x2={sx(0)} y1={PAD_T} y2={H - PAD_B} className={styles.axis} />
        {[0, 1, 2, 3, 4, 5].map((t) => (
          <text key={t} x={sx(t)} y={H - 8} className={styles.tick} textAnchor="middle">
            {t}
          </text>
        ))}
        {[4, 8, 12].map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={sy(t)} y2={sy(t)} className={styles.gridLine} />
            <text x={PAD_L - 6} y={sy(t) + 4} className={styles.tick} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {XS.map((x, i) => (
          <line key={i} x1={sx(x)} x2={sx(x)} y1={sy(YS[i])} y2={sy(clipY(lineAt(x)))} className={styles.residual} />
        ))}
        <line
          x1={sx(X_RANGE[0])}
          y1={sy(clipY(lineAt(X_RANGE[0])))}
          x2={sx(X_RANGE[1])}
          y2={sy(clipY(lineAt(X_RANGE[1])))}
          className={styles.fitLine}
          style={{ transition: 'all 0.5s ease' }}
        />
        {XS.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(YS[i])} r={6} className={styles.point} />
        ))}
      </svg>

      <div className={styles.readouts}>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>w</span>
          <span className={styles.readoutValue}>{f2(st.w)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>b</span>
          <span className={styles.readoutValue}>{f2(st.b)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>loss</span>
          <span className={styles.readoutValue}>{f2(st.loss)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>w.grad</span>
          <span className={styles.readoutValue}>{f2(st.gw)}</span>
        </div>
        <div className={styles.readout}>
          <span className={styles.readoutLabel}>b.grad</span>
          <span className={styles.readoutValue}>{f2(st.gb)}</span>
        </div>
      </div>

      <div className={styles.sparkBox}>
        <div className={styles.sparkLabel}>
          <span>loss (log scale)</span>
          <span>step {stepNo}</span>
        </div>
        <svg viewBox={`0 0 ${SW} ${SH}`} className={styles.svg} role="img" aria-label="Loss over training steps">
          <path d={sparkPath(STEPS)} className={styles.spark} opacity={0.35} />
          <path d={sparkPath(stepNo)} className={styles.sparkDone} />
          <circle cx={px(stepNo)} cy={py(logs[stepNo])} r={4.5} className={styles.sparkDot} />
        </svg>
      </div>

      <p className={styles.hint}>Next update: w ← w − {LR} × w.grad, b ← b − {LR} × b.grad</p>

      <div className={styles.stepperRow}>
        <StepControls stepper={stepper} label={`Step ${stepNo} of ${STEPS}`} />
      </div>
    </Figure>
  );
}

import { Figure, StepControls, useStepper } from '../../components';
import styles from './TrainingLoopAnimation.module.css';

/**
 * A simulated pretraining run on a tiny text. Each stepper tick is one training
 * step; four ticks make an epoch. The loss curves are made-up but shaped like a
 * real run on a small dataset: training loss keeps falling while validation
 * loss flattens and then creeps up (overfitting). Sample text is shown at
 * epoch boundaries.
 */

const EPOCHS = 10;
const STEPS_PER_EPOCH = 4;
const TOTAL = EPOCHS * STEPS_PER_EPOCH + 1;

const PHASES = ['Forward', 'Loss', 'Backward', 'Update'] as const;
const PHASE_HINT = [
  'Run a batch through the model to get logits.',
  'Compare logits with the targets: cross-entropy.',
  'loss.backward() computes a gradient for every weight.',
  'optimizer.step() nudges the weights downhill.',
];

// Deterministic, plausible loss curves (epoch → loss).
const trainLoss = (e: number) => 0.3 + 9.7 * Math.exp(-e / 2) + 0.15 * Math.sin(e * 3.1) * Math.exp(-e / 4);
const valLoss = (e: number) => 6.1 + 3.9 * Math.exp(-e) + 0.05 * Math.max(0, e - 3) ** 1.5;

const SAMPLES: { from: number; text: string; note: string }[] = [
  { from: 0, text: 'The keeper climbed ursvenstadt ursvenstadt ursvenstadt', note: 'random weights: gibberish' },
  { from: 1, text: 'The keeper climbed , , the the the . . .', note: 'learned common tokens' },
  { from: 2, text: 'The keeper climbed the the, and the of the sea the.', note: 'word-like, no grammar' },
  { from: 3, text: 'The keeper climbed the stairs and the light was the sea.', note: 'grammar emerging' },
  { from: 5, text: 'The keeper climbed the stairs, and the lamp was cold, and he said nothing.', note: 'fluent-ish' },
  {
    from: 7,
    text: 'The keeper climbed the ninety steps as he had every night for thirty years, and lit the great lamp.',
    note: 'memorised: copied from the training text',
  },
];

// Chart geometry (SVG user units; the SVG scales to its container).
const W = 400;
const H = 210;
const PAD_L = 30;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 26;
const Y_MAX = 10;
const sx = (e: number) => PAD_L + (e / EPOCHS) * (W - PAD_L - PAD_R);
const sy = (l: number) => PAD_T + (1 - l / Y_MAX) * (H - PAD_T - PAD_B);

function pathUpTo(fn: (e: number) => number, upTo: number) {
  const pts: string[] = [];
  const n = Math.max(1, Math.round(upTo * 10));
  for (let i = 0; i <= n; i++) {
    const e = (upTo * i) / n;
    pts.push(`${i === 0 ? 'M' : 'L'}${sx(e).toFixed(1)},${sy(fn(e)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function TrainingLoopAnimation() {
  const stepper = useStepper(TOTAL, 380);
  const { step } = stepper;
  const epoch = step / STEPS_PER_EPOCH;
  const phase = step === 0 ? -1 : (step - 1) % STEPS_PER_EPOCH;
  const sample = [...SAMPLES].reverse().find((s) => Math.floor(epoch) >= s.from) ?? SAMPLES[0];
  const t = trainLoss(epoch);
  const v = valLoss(epoch);
  const overfitting = epoch > 3.5;

  return (
    <Figure
      title="A tiny pretraining run"
      caption="Simulated numbers. With only a few thousand tokens of text, the model eventually memorises the training set: training loss keeps dropping while validation loss stalls and rises."
    >
      <ol className={styles.loop} aria-label="Training step phases">
        {PHASES.map((name, i) => (
          <li key={name} data-active={i === phase}>
            {name}
          </li>
        ))}
      </ol>
      <p className={styles.hint}>{phase < 0 ? 'Press play to start training.' : PHASE_HINT[phase]}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label="Training and validation loss by epoch">
        {overfitting && (
          <rect x={sx(3.5)} y={PAD_T} width={sx(epoch) - sx(3.5)} height={H - PAD_T - PAD_B} className={styles.overfit} />
        )}
        {[0, 2, 4, 6, 8, 10].map((l) => (
          <g key={l}>
            <line x1={PAD_L} x2={W - PAD_R} y1={sy(l)} y2={sy(l)} className={styles.grid} />
            <text x={PAD_L - 6} y={sy(l) + 4} textAnchor="end" className={styles.tick}>
              {l}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10].map((e) => (
          <text key={e} x={sx(e)} y={H - 8} textAnchor="middle" className={styles.tick}>
            {e}
          </text>
        ))}
        {overfitting && (
          <text x={sx(3.7)} y={PAD_T + 14} className={styles.overfitLabel}>
            overfitting
          </text>
        )}
        {step > 0 && (
          <>
            <path d={pathUpTo(trainLoss, epoch)} className={styles.train} />
            <path d={pathUpTo(valLoss, epoch)} className={styles.val} />
          </>
        )}
        <circle cx={sx(epoch)} cy={sy(t)} r={4.5} className={styles.trainDot} />
        <circle cx={sx(epoch)} cy={sy(v)} r={4.5} className={styles.valDot} />
      </svg>

      <div className={styles.legend}>
        <span>
          <span className={styles.swatchTrain} /> train {t.toFixed(2)}
        </span>
        <span>
          <span className={styles.swatchVal} /> validation {v.toFixed(2)}
        </span>
      </div>

      <div className={styles.sample} data-memorised={sample.from >= 7}>
        <span className={styles.sampleLabel}>
          Sample after epoch {Math.floor(epoch)} · {sample.note}
        </span>
        <p key={sample.text}>{sample.text}</p>
      </div>

      <StepControls stepper={stepper} label={`Epoch ${epoch.toFixed(2)}`} />
    </Figure>
  );
}

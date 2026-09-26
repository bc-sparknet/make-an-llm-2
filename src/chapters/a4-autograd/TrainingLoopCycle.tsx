import { useEffect, useState } from 'react';
import { Figure } from '../../components';
import styles from './widgets.module.css';

/**
 * The five moves of one training step, arranged as a loop. Tap a stage to see
 * its line of code and what breaks if you leave it out.
 */

const STAGES = [
  {
    label: 'zero_grad',
    code: 'optimizer.zero_grad()',
    what: 'Wipe the gradients left over from the previous batch, so this batch starts from a clean slate.',
    skip: 'Gradients pile up. Each .grad becomes the sum of this batch’s gradient and every earlier one, so the steps grow larger and point in stale directions. The loss jumps around or blows up.',
  },
  {
    label: 'forward',
    code: 'logits = model(xb)',
    what: 'Run the batch through the model. Because the parameters have requires_grad=True, PyTorch records the computation graph as it goes.',
    skip: 'There are no predictions, so there is nothing to score and nothing to learn from. Every later step depends on this one.',
  },
  {
    label: 'loss',
    code: 'loss = loss_fn(logits, yb)',
    what: 'Boil the batch down to one number that says how wrong the predictions were (e.g. cross-entropy).',
    skip: 'backward() has to start from a single number. Without a loss there is no “downhill” to find.',
  },
  {
    label: 'backward',
    code: 'loss.backward()',
    what: 'Walk the recorded graph backwards and fill every parameter’s .grad with the slope of the loss.',
    skip: 'The .grad fields stay empty (or zero), so optimizer.step() has nothing to go on. The weights never change and the loss stays flat.',
  },
  {
    label: 'step',
    code: 'optimizer.step()',
    what: 'Nudge every parameter against its gradient. For plain SGD that is w ← w − lr·grad; AdamW is a smarter version.',
    skip: 'Gradients are computed and then thrown away by the next zero_grad(). The model does all the work of learning but never changes: the loss stays flat.',
  },
];

const CX = 170;
const CY = 146;
const R = 106;
const NR = 37;
const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / STAGES.length;
const pt = (a: number, r = R) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });

export function TrainingLoopCycle() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STAGES.length), 1600);
    return () => clearTimeout(t);
  }, [playing, active]);

  const select = (i: number) => {
    setPlaying(false);
    setActive(i);
    setShowSkip(false);
  };

  // Gap (in radians) left between an arc and the node circles it joins.
  const gap = (NR + 6) / R;
  const stage = STAGES[active];

  return (
    <Figure
      title="The training loop"
      caption="One pass around the circle is one training step on one batch. Tap a stage (or press Play) to see its code, then tap the red button to see what goes wrong if it's missing."
    >
      <svg viewBox="0 0 340 294" className={styles.svg} role="group" aria-label="Training loop stages">
        {STAGES.map((_, i) => {
          const a0 = angle(i) + gap;
          const a1 = angle(i + 1) - gap;
          const p0 = pt(a0);
          const p1 = pt(a1);
          // Arrow head at p1, pointing along the circle (clockwise).
          const tx = -Math.sin(a1);
          const ty = Math.cos(a1);
          const nx = -ty;
          const ny = tx;
          const head = `${p1.x + tx * 2},${p1.y + ty * 2} ${p1.x - tx * 8 + nx * 5},${p1.y - ty * 8 + ny * 5} ${p1.x - tx * 8 - nx * 5},${p1.y - ty * 8 - ny * 5}`;
          return (
            <g key={i}>
              <path d={`M${p0.x},${p0.y} A${R},${R} 0 0 1 ${p1.x},${p1.y}`} className={styles.arc} />
              <polygon points={head} className={styles.arrowHead} />
            </g>
          );
        })}
        <text x={CX} y={CY - 4} textAnchor="middle" className={styles.centerStrong}>
          one batch
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" className={styles.centerText}>
          repeat for every batch
        </text>
        {STAGES.map((s, i) => {
          const p = pt(angle(i));
          return (
            <g
              key={s.label}
              className={styles.stage}
              data-active={i === active}
              role="button"
              tabIndex={0}
              aria-pressed={i === active}
              aria-label={`${i + 1}. ${s.label}`}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(i);
                }
              }}
            >
              <circle cx={p.x} cy={p.y} r={NR} className={styles.stageCircle} />
              <text x={p.x} y={p.y - 6} textAnchor="middle" className={styles.stageNum}>
                {i + 1}
              </text>
              <text x={p.x} y={p.y + 11} textAnchor="middle" className={styles.stageLabel}>
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>

      <code className={styles.codeLine}>{stage.code}</code>
      <p className={styles.stageText} aria-live="polite">
        {stage.what}
      </p>
      <button className={styles.skipToggle} onClick={() => setShowSkip((v) => !v)} aria-expanded={showSkip}>
        {showSkip ? 'Hide' : `What if I skip ${stage.label}?`}
      </button>
      {showSkip && <div className={styles.skipText}>{stage.skip}</div>}

      <div className={`${styles.buttonRow} ${styles.stepperRow}`}>
        <button className={styles.button} onClick={() => select((active + STAGES.length - 1) % STAGES.length)}>
          ‹ Prev
        </button>
        <button className={`${styles.button} ${styles.primary}`} onClick={() => { setShowSkip(false); setPlaying((p) => !p); }}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className={styles.button} onClick={() => select((active + 1) % STAGES.length)}>
          Next ›
        </button>
      </div>
    </Figure>
  );
}

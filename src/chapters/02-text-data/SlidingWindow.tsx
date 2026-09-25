import { useState } from 'react';
import { Figure, Slider, StepControls, TokenChips, useStepper } from '../../components';
import styles from './widgets.module.css';

/**
 * Shows how a long token sequence is cut into (input, target) training pairs.
 * The target is the input shifted one position to the right.
 */

const TEXT = 'Once upon a time , a small robot learned to read every book in the old library .'.split(' ');

export function SlidingWindow() {
  const [contextLength, setContextLength] = useState(4);
  const [stride, setStride] = useState(4);

  // Each window needs contextLength inputs plus one extra token for the final target.
  const starts: number[] = [];
  for (let i = 0; i + contextLength < TEXT.length; i += stride) starts.push(i);

  const stepper = useStepper(starts.length, 1300);
  const start = starts[Math.min(stepper.step, starts.length - 1)] ?? 0;

  const inputIdx = Array.from({ length: contextLength }, (_, k) => start + k);
  const targetIdx = inputIdx.map((i) => i + 1);
  const outside = TEXT.map((_, i) => i).filter((i) => i < start || i > start + contextLength);

  return (
    <Figure
      title="Sliding window data sampler"
      caption="Each training example is a window of tokens. The target is the same window shifted by one, so a single window contains several next-token prediction tasks. A stride smaller than the context length makes windows overlap; equal to it, they don't."
    >
      <div className={styles.controlsGrid}>
        <Slider label="Context length" min={2} max={8} value={contextLength} onChange={setContextLength} />
        <Slider label="Stride" min={1} max={8} value={stride} onChange={setStride} />
      </div>

      <TokenChips tokens={TEXT} dim={outside} highlight={inputIdx} />

      <div className={styles.pairs}>
        <div className={styles.pairLabel}>input</div>
        <TokenChips tokens={inputIdx.map((i) => TEXT[i])} />
        <div className={styles.pairLabel}>target</div>
        <TokenChips tokens={targetIdx.map((i) => TEXT[i])} />
      </div>

      <details className={styles.details}>
        <summary>What the model learns from this window</summary>
        <ol className={styles.tasks}>
          {inputIdx.map((_, k) => (
            <li key={k}>
              <span className={styles.muted}>{inputIdx.slice(0, k + 1).map((i) => TEXT[i]).join(' ')}</span> →{' '}
              <strong>{TEXT[targetIdx[k]]}</strong>
            </li>
          ))}
        </ol>
      </details>

      <StepControls stepper={stepper} label={`Window ${stepper.step + 1} of ${starts.length}`} />
    </Figure>
  );
}

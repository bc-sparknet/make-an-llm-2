import { useState } from 'react';
import { Figure, FunctionPlot, Slider } from '../../components';
import styles from './LossExplorer.module.css';

/**
 * Drag the probability the model assigns to the correct token and watch
 * −log(p) respond. Near p = 1 the loss is almost zero; near p = 0 it explodes.
 */
export function LossExplorer() {
  const [p, setP] = useState(0.5);
  const loss = -Math.log(p);

  let verdict: string;
  if (p >= 0.9) verdict = 'Confident and correct: almost no penalty.';
  else if (p >= 0.4) verdict = 'Reasonable guess: a moderate penalty.';
  else if (p >= 0.1) verdict = 'Mostly wrong: the penalty is climbing fast.';
  else verdict = 'Confidently wrong: the correct token was nearly ruled out, so the penalty is huge.';

  return (
    <Figure
      title="The −log(p) penalty"
      caption="Halving an already small probability always adds the same amount (about 0.69) to the loss, so the curve never flattens out as p approaches 0."
    >
      <FunctionPlot
        series={[{ label: 'loss = −log(p)', fn: (x) => -Math.log(Math.max(x, 1e-6)), color: 'var(--accent)' }]}
        xRange={[0, 1]}
        yRange={[0, 5]}
        markerX={p}
        height={200}
      />
      <Slider
        label="Probability of the correct token"
        value={p}
        min={0.01}
        max={1}
        step={0.01}
        onChange={setP}
        format={(v) => v.toFixed(2)}
      />
      <div className={styles.readout}>
        <div>
          <span className={styles.big}>{loss.toFixed(2)}</span>
          <span className={styles.small}>loss</span>
        </div>
        <div>
          <span className={styles.big}>{(1 / p).toFixed(1)}</span>
          <span className={styles.small}>exp(loss)</span>
        </div>
      </div>
      <p className={styles.verdict} data-bad={p < 0.1}>
        {verdict}
      </p>
    </Figure>
  );
}

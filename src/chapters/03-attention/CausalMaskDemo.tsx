import { useState } from 'react';
import { Figure, HeatGrid, Segmented, Slider } from '../../components';
import { EMBEDDINGS, TOKENS, attention, dropout, headWeights } from './attention';
import styles from './CausalMaskDemo.module.css';

/**
 * Full attention-weight matrix for the example sentence with toggles for the
 * causal mask and for dropout on the weights (seeded, inverted dropout).
 */

const W = headWeights(3, 4, 11, 1.5);

type Stage = 'scores' | 'weights';
type Mask = 'off' | 'on';

export function CausalMaskDemo() {
  const [mask, setMask] = useState<Mask>('on');
  const [stage, setStage] = useState<Stage>('weights');
  const [p, setP] = useState(0);

  const A = attention(EMBEDDINGS, W.Wq, W.Wk, W.Wv, mask === 'on');
  const dropped = dropout(A.weights, p, 42);
  const shown = stage === 'scores' ? A.masked : dropped.out;
  const rowSums = dropped.out.map((r) => r.reduce((a, b) => a + b, 0));

  return (
    <Figure
      title="Causal mask and dropout"
      caption="Rows are queries, columns are keys. With the mask on, each word can only see itself and the words before it. Masked cells are −∞ (hatched) before softmax and exactly 0 after it."
    >
      <div className={styles.controls}>
        <Segmented
          label="Causal mask"
          value={mask}
          onChange={setMask}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'On' },
          ]}
        />
        <Segmented
          label="Show"
          value={stage}
          onChange={setStage}
          options={[
            { value: 'scores', label: 'Before softmax' },
            { value: 'weights', label: 'After softmax' },
          ]}
        />
      </div>

      <HeatGrid
        data={shown}
        rowLabels={TOKENS}
        colLabels={TOKENS}
        min={stage === 'weights' ? 0 : undefined}
        max={stage === 'weights' ? Math.max(1, ...shown.flat()) : undefined}
      />

      {stage === 'weights' ? (
        <p className={styles.sums}>
          Row sums:{' '}
          {rowSums.map((s, i) => (
            <span key={i} className={styles.sum}>
              {s.toFixed(2)}
            </span>
          ))}
        </p>
      ) : (
        <p className={styles.sums}>Scaled scores. Masked cells are set to −∞ so softmax gives them zero weight.</p>
      )}

      <div className={styles.dropout} data-disabled={stage !== 'weights'}>
        <Slider
          label="Dropout rate p"
          value={p}
          min={0}
          max={0.5}
          step={0.1}
          onChange={(v) => {
            setP(v);
            setStage('weights');
          }}
          format={(v) => (v === 0 ? 'off' : `${Math.round(v * 100)}%  (×${(1 / (1 - v)).toFixed(2)})`)}
        />
        <p className={styles.hint}>
          {p === 0
            ? 'Drag to drop random weights during training.'
            : `About ${Math.round(p * 100)}% of weights are zeroed; the survivors are scaled by 1/(1−p) so the average row sum stays near 1.`}
        </p>
      </div>
    </Figure>
  );
}

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Figure, HeatGrid, Segmented } from '../../components';
import type { Matrix } from '../../lib/math';
import { EMBEDDINGS, TOKENS, attention, headWeights } from './attention';
import styles from './MultiHeadDemo.module.css';

/**
 * Several causal attention heads run side by side on the same sentence. Each
 * head has its own (seeded) W_q, W_k, W_v, so each learns to look at different
 * things. Their outputs are concatenated and mixed by an output projection.
 */

const D_OUT = 12;
const HEAD_COLORS = ['var(--accent)', 'var(--blue)', 'var(--green)', 'var(--purple)'];
const SEEDS = [3, 29, 57, 88];

type HeadCount = '2' | '3' | '4';

function headPatterns(n: number): Matrix[] {
  const headDim = D_OUT / n;
  return SEEDS.slice(0, n).map((seed) => {
    const w = headWeights(3, headDim, seed, 2.2);
    return attention(EMBEDDINGS, w.Wq, w.Wk, w.Wv, true).weights;
  });
}

function MiniGrid({ data, color }: { data: Matrix; color: string }) {
  return (
    <div className={styles.mini} style={{ '--head': color } as CSSProperties}>
      {data.flatMap((row, i) =>
        row.map((v, j) => (
          <span
            key={`${i}-${j}`}
            className={styles.miniCell}
            data-masked={j > i}
            style={j > i ? undefined : { background: `color-mix(in srgb, var(--head) ${Math.round(v * 100)}%, var(--heat-low))` }}
          />
        )),
      )}
    </div>
  );
}

export function MultiHeadDemo() {
  const [count, setCount] = useState<HeadCount>('2');
  const [active, setActive] = useState(0);
  const n = Number(count);
  const heads = headPatterns(n);
  const sel = Math.min(active, n - 1);
  const headDim = D_OUT / n;

  return (
    <Figure
      title="Multiple heads, multiple patterns"
      caption="Each head sees the same tokens but uses its own projections, so it spreads its attention differently. The heads' outputs are glued together and mixed by one more linear layer."
    >
      <Segmented
        label="Number of heads"
        value={count}
        onChange={(v) => {
          setCount(v);
          setActive(0);
        }}
        options={[
          { value: '2', label: '2 heads' },
          { value: '3', label: '3 heads' },
          { value: '4', label: '4 heads' },
        ]}
      />

      <div className={styles.thumbs} role="radiogroup" aria-label="Choose a head">
        {heads.map((h, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={i === sel}
            className={styles.thumb}
            onClick={() => setActive(i)}
            style={{ '--head': HEAD_COLORS[i] } as CSSProperties}
          >
            <MiniGrid data={h} color={HEAD_COLORS[i]} />
            <span className={styles.thumbLabel}>Head {i + 1}</span>
          </button>
        ))}
      </div>

      <p className={styles.headTitle}>
        <span className={styles.dot} style={{ background: HEAD_COLORS[sel] }} />
        Head {sel + 1} attention weights
      </p>
      <HeatGrid data={heads[sel]} rowLabels={TOKENS} colLabels={TOKENS} min={0} max={1} />

      <div className={styles.diagram} aria-label="Concatenation and output projection">
        <div className={styles.stageLabel}>
          Concatenate {n} × {headDim} = {D_OUT} values per token
        </div>
        <div className={styles.bar}>
          {Array.from({ length: D_OUT }, (_, d) => {
            const h = Math.floor(d / headDim);
            return (
              <span
                key={d}
                className={styles.barCell}
                data-first={d % headDim === 0}
                style={{ background: HEAD_COLORS[h], opacity: h === sel ? 1 : 0.45 }}
              />
            );
          })}
        </div>
        <div className={styles.arrow}>
          <span>↓</span> <code>out_proj</code>: Linear({D_OUT}, {D_OUT})
        </div>
        <div className={styles.bar}>
          {Array.from({ length: D_OUT }, (_, d) => (
            <span key={d} className={`${styles.barCell} ${styles.mixed}`} />
          ))}
        </div>
        <div className={styles.stageLabel}>Output: every value now mixes all heads</div>
      </div>
    </Figure>
  );
}

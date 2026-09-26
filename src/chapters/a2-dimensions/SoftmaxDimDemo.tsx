import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import { softmax, transpose } from '../../lib/math';
import styles from './widgets.module.css';

/**
 * Softmax of a [3, 4] score matrix along dim=-1 (rows) or dim=0 (columns).
 * Outlines show which cells share one softmax; the row sums (right) and
 * column sums (bottom) show which direction now adds up to 1.
 */

const SCORES = [
  [2.0, 1.0, 0.1, 0.5],
  [0.3, 2.5, 0.2, 1.0],
  [1.2, 0.4, 3.0, 0.0],
];
const R = SCORES.length;
const C = SCORES[0].length;

type DimOpt = '-1' | '0';

const f2 = (v: number) => v.toFixed(2);

export function SoftmaxDimDemo() {
  const [dim, setDim] = useState<DimOpt>('-1');
  const probs = dim === '-1' ? SCORES.map((r) => softmax(r)) : transpose(transpose(SCORES).map((c) => softmax(c)));
  const rowSums = probs.map((r) => r.reduce((a, b) => a + b, 0));
  const colSums = transpose(probs).map((c) => c.reduce((a, b) => a + b, 0));
  const isOne = (v: number) => Math.abs(v - 1) < 0.005;
  const rows = dim === '-1';

  // Grid: label column, C value columns, one sum column; header row, R value rows, one sum row.
  const cols = `auto repeat(${C}, minmax(46px, 1fr)) minmax(46px, 1fr)`;

  return (
    <Figure
      title="Softmax along a dimension"
      caption="Each outlined group goes through one softmax, so its values add up to 1. With dim=−1 the groups are rows: one set of attention weights per query token. With dim=0 the columns sum to 1 instead, and the rows (what attention needs) don't."
    >
      <div className={styles.root}>
        <Segmented
          label="torch.softmax(scores, dim=…)"
          value={dim}
          onChange={setDim}
          options={[
            { value: '-1', label: 'dim=−1 (rows)' },
            { value: '0', label: 'dim=0 (cols)' },
          ]}
        />

        <div className="scroll-x">
          <div className={styles.smGrid} style={{ gridTemplateColumns: cols }} role="table" aria-label="softmax result">
            <span className={styles.smLabel} style={{ gridRow: 1, gridColumn: 1 }} />
            {Array.from({ length: C }, (_, j) => (
              <span key={j} className={styles.smLabel} style={{ gridRow: 1, gridColumn: j + 2 }}>
                key {j}
              </span>
            ))}
            <span className={styles.smLabel} style={{ gridRow: 1, gridColumn: C + 2 }}>
              row Σ
            </span>

            {/* Outlines around the groups that share a softmax. */}
            {rows
              ? probs.map((_, i) => (
                  <span key={`b${i}`} className={styles.smBand} style={{ gridRow: i + 2, gridColumn: `2 / span ${C}` }} />
                ))
              : Array.from({ length: C }, (_, j) => (
                  <span key={`b${j}`} className={styles.smBand} style={{ gridRow: `2 / span ${R}`, gridColumn: j + 2 }} />
                ))}

            {probs.map((r, i) => (
              <div key={i} style={{ display: 'contents' }} role="row">
                <span className={styles.smLabel} style={{ gridRow: i + 2, gridColumn: 1 }}>
                  q{i}
                </span>
                {r.map((p, j) => (
                  <span
                    key={j}
                    role="cell"
                    className={styles.smCell}
                    data-strong={p > 0.5}
                    style={{
                      gridRow: i + 2,
                      gridColumn: j + 2,
                      background: `color-mix(in srgb, var(--heat-high) ${Math.round(p * 100)}%, var(--heat-low))`,
                    }}
                    title={`score ${SCORES[i][j]}`}
                  >
                    {f2(p)}
                  </span>
                ))}
                <span className={styles.smSum} data-one={isOne(rowSums[i])} style={{ gridRow: i + 2, gridColumn: C + 2 }}>
                  {f2(rowSums[i])}
                </span>
              </div>
            ))}

            <span className={styles.smLabel} style={{ gridRow: R + 2, gridColumn: 1 }}>
              col Σ
            </span>
            {colSums.map((s, j) => (
              <span key={j} className={styles.smSum} data-one={isOne(s)} style={{ gridRow: R + 2, gridColumn: j + 2 }}>
                {f2(s)}
              </span>
            ))}
          </div>
        </div>

        <p className={styles.verdict} data-ok={rows}>
          {rows ? (
            <>
              <strong>Rows sum to 1.</strong> Row <code>q0</code> says how query 0 splits its attention over the 4 keys:
              57% on key 0, 21% on key 1, and so on.
            </>
          ) : (
            <>
              <strong>Columns sum to 1, rows don't.</strong> Query 2's &ldquo;weights&rdquo; add up to{' '}
              {f2(rowSums[2])}. Nothing crashed: the shapes are identical, so only the numbers are wrong.
            </>
          )}
        </p>

        <p className={`${styles.muted} ${styles.small}`}>
          Raw scores: <code>[[2.0, 1.0, 0.1, 0.5], [0.3, 2.5, 0.2, 1.0], [1.2, 0.4, 3.0, 0.0]]</code>
        </p>
      </div>
    </Figure>
  );
}

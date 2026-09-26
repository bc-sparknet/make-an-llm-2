import { Fragment } from 'react';
import { Figure, StepControls, useStepper } from '../../components';
import { matmul } from '../../lib/math';
import styles from './widgets.module.css';

/**
 * Walks through A (3×2) @ B (2×3) one output cell at a time. B sits above the
 * answer and A to its left, so row i of A and column j of B visibly meet at
 * C[i, j]. Tap any output cell to jump to it.
 */

const A = [
  [1, 2],
  [3, 0],
  [2, 1],
];
const B = [
  [1, 0, 2],
  [3, 1, 1],
];
const C = matmul(A, B);
const N = A.length; // rows of A
const K = B.length; // inner dimension
const M = B[0].length; // columns of B

export function MatmulStepper() {
  const stepper = useStepper(N * M, 1500);
  const i = Math.floor(stepper.step / M);
  const j = stepper.step % M;

  // Grid lines: rows 1-2 hold B, row 3 is a spacer, rows 4-6 hold A and C.
  // Columns 1-2 hold A, column 3 is a spacer, columns 4-6 hold B and C.
  const products = Array.from({ length: K }, (_, k) => A[i][k] * B[k][j]);

  return (
    <Figure
      title="Matrix multiply, one dot product at a time"
      caption="Every output cell is one dot product: a row of A against a column of B. Both have length 2, the shared inner dimension. That dimension gets summed away, so it doesn't appear in the output's shape."
    >
      <div className={styles.shapeEq} aria-label="Shapes: 3 by 2 at 2 by 3 gives 3 by 3">
        <span>
          A (<span className={styles.rows}>3</span> × <span className={styles.cancel}>2</span>)
        </span>
        <span className={styles.op}>@</span>
        <span>
          B (<span className={styles.cancel}>2</span> × <span className={styles.cols}>3</span>)
        </span>
        <span className={styles.op}>→</span>
        <span>
          C (<span className={styles.rows}>3</span> × <span className={styles.cols}>3</span>)
        </span>
      </div>

      <div className={styles.mmGrid}>
        <div className={styles.corner} aria-hidden="true">
          <span>
            <b>B</b> 2×3 →
          </span>
          <span className={styles.cornerA}>
            <b>A</b> 3×2 ↓
          </span>
        </div>

        {B.map((row, k) =>
          row.map((v, c) => (
            <span
              key={`b${k}${c}`}
              className={styles.mcell}
              data-role="b"
              data-state={c === j ? 'colHi' : 'faded'}
              style={{ gridRow: k + 1, gridColumn: c + 4 }}
              aria-label={`B[${k}, ${c}] = ${v}`}
            >
              {v}
            </span>
          )),
        )}

        {A.map((row, r) => (
          <Fragment key={`a${r}`}>
            {row.map((v, k) => (
              <span
                key={`a${r}${k}`}
                className={styles.mcell}
                data-role="a"
                data-state={r === i ? 'rowHi' : 'faded'}
                style={{ gridRow: r + 4, gridColumn: k + 1 }}
                aria-label={`A[${r}, ${k}] = ${v}`}
              >
                {v}
              </span>
            ))}
            {C[r].map((v, c) => {
              const idx = r * M + c;
              const state = idx === stepper.step ? 'active' : idx < stepper.step ? 'done' : 'empty';
              return (
                <button
                  key={`c${r}${c}`}
                  className={styles.mcell}
                  data-state={state}
                  style={{ gridRow: r + 4, gridColumn: c + 4 }}
                  onClick={() => stepper.setStep(idx)}
                  aria-label={`Show how C[${r}, ${c}] is computed`}
                >
                  {state === 'empty' ? '?' : v}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className={styles.calc} aria-live="polite">
        <span className={styles.calcTitle}>
          C[{i}, {j}] = <span className={styles.pa}>row {i} of A</span> · <span className={styles.pb}>column {j} of B</span>
        </span>
        <span className={styles.calcMath}>
          {Array.from({ length: K }, (_, k) => (
            <Fragment key={k}>
              {k > 0 && ' + '}
              <span className={styles.pa}>{A[i][k]}</span>×<span className={styles.pb}>{B[k][j]}</span>
            </Fragment>
          ))}
          {' = '}
          {products.join(' + ')} = <strong>{C[i][j]}</strong>
        </span>
      </div>

      <StepControls stepper={stepper} label={`Cell C[${i}, ${j}] · ${stepper.step + 1} of ${N * M}`} />
    </Figure>
  );
}

import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import { matmul } from '../../lib/math';
import type { Matrix } from '../../lib/math';
import styles from './widgets.module.css';

/**
 * X [2, 2, 3] @ Y [2, 3, 2] drawn as what it really is: two separate matrix
 * multiplies, one per batch index. Pick a batch index, then tap an output
 * cell to see which row and column produced it.
 */

const X: Matrix[] = [
  [
    [1, 0, 2],
    [0, 1, 1],
  ],
  [
    [2, 1, 0],
    [1, 3, 1],
  ],
];
const Y: Matrix[] = [
  [
    [1, 2],
    [0, 1],
    [3, 0],
  ],
  [
    [0, 1],
    [2, 0],
    [1, 1],
  ],
];
const Z = X.map((x, b) => matmul(x, Y[b]));

type State = 'rowHi' | 'colHi' | 'active' | undefined;

function Mat({
  m,
  name,
  state,
  onClick,
}: {
  m: Matrix;
  name: string;
  state?: (r: number, c: number) => State;
  onClick?: (r: number, c: number) => void;
}) {
  return (
    <div className={styles.matLabel}>
      <div className={styles.mat} style={{ gridTemplateColumns: `repeat(${m[0].length}, auto)` }}>
        {m.map((row, r) =>
          row.map((v, c) =>
            onClick ? (
              <button
                key={`${r}${c}`}
                className={styles.cell}
                data-state={state?.(r, c)}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(r, c);
                }}
                aria-label={`${name}[${r}, ${c}] = ${v}`}
              >
                {v}
              </button>
            ) : (
              <span key={`${r}${c}`} className={styles.cell} data-state={state?.(r, c)}>
                {v}
              </span>
            ),
          ),
        )}
      </div>
      <span className={styles.matName}>{name}</span>
    </div>
  );
}

export function BatchedMatmulDemo() {
  const [batch, setBatch] = useState<'0' | '1'>('0');
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  const sel = Number(batch);
  const [r, c] = cell;

  return (
    <Figure
      title="Batched matmul = a stack of separate matmuls"
      caption="The leading dimension is just a counter. Slice 0 of X only ever meets slice 0 of Y; slice 1 only meets slice 1. Each pair is an ordinary (2×3) @ (3×2) multiply, and the results are stacked back up."
    >
      <div className={styles.shapeEq}>
        <span>
          X [<span className={styles.batch}>2</span>, <span className={styles.rows}>2</span>,{' '}
          <span className={styles.cancel}>3</span>]
        </span>
        <span className={styles.op}>@</span>
        <span>
          Y [<span className={styles.batch}>2</span>, <span className={styles.cancel}>3</span>,{' '}
          <span className={styles.cols}>2</span>]
        </span>
        <span className={styles.op}>→</span>
        <span>
          [<span className={styles.batch}>2</span>, <span className={styles.rows}>2</span>, <span className={styles.cols}>2</span>]
        </span>
      </div>

      <Segmented
        label="Batch index"
        value={batch}
        onChange={setBatch}
        options={[
          { value: '0', label: 'X[0] @ Y[0]' },
          { value: '1', label: 'X[1] @ Y[1]' },
        ]}
      />

      <div style={{ height: 'var(--space-3)' }} />

      {[0, 1].map((b) => {
        const active = b === sel;
        return (
          <div
            key={b}
            className={styles.batchRow}
            data-active={active}
            onClick={() => setBatch(String(b) as '0' | '1')}
            role="group"
            aria-label={`Batch index ${b}`}
          >
            <span className={styles.batchLabel}>batch index {b}</span>
            <div className={styles.eqRow}>
              <Mat m={X[b]} name={`X[${b}]`} state={(i) => (active && i === r ? 'rowHi' : undefined)} />
              <span className={styles.op}>@</span>
              <Mat m={Y[b]} name={`Y[${b}]`} state={(_, j) => (active && j === c ? 'colHi' : undefined)} />
              <span className={styles.op}>=</span>
              <Mat
                m={Z[b]}
                name={`Z[${b}]`}
                state={(i, j) => (active && i === r && j === c ? 'active' : undefined)}
                onClick={(i, j) => {
                  setBatch(String(b) as '0' | '1');
                  setCell([i, j]);
                }}
              />
            </div>
          </div>
        );
      })}

      <div className={styles.calc} aria-live="polite">
        <span className={styles.calcTitle}>
          Z[{sel}, {r}, {c}] = <span className={styles.pa}>X[{sel}, {r}, :]</span> ·{' '}
          <span className={styles.pb}>Y[{sel}, :, {c}]</span>
        </span>
        <span className={styles.calcMath}>
          {X[sel][r].map((v, k) => (
            <span key={k}>
              {k > 0 && ' + '}
              <span className={styles.pa}>{v}</span>×<span className={styles.pb}>{Y[sel][k][c]}</span>
            </span>
          ))}{' '}
          = <strong>{Z[sel][r][c]}</strong>
        </span>
        <span className={styles.muted} style={{ fontSize: '0.8rem' }}>
          Tap a cell of Z[0] or Z[1]. The batch index is the same in all three tensors.
        </span>
      </div>
    </Figure>
  );
}

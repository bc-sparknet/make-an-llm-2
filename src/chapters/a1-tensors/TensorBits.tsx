import type { ReactNode } from 'react';
import styles from './widgets.module.css';

/**
 * Small chapter-local pieces that complement the shared TensorView:
 * a colour-coded shape, a 0-D "scalar" box, and a 4-D grid of matrices.
 * Dimension colours match TensorView (dim 0 accent, 1 blue, 2 green) and add
 * purple for dim 3.
 */

/** One dimension's size or index, coloured by its position. */
export function Dim({ d, children }: { d: number; children: ReactNode }) {
  return (
    <span className={styles.dim} data-dim={d}>
      {children}
    </span>
  );
}

/**
 * "[2, 3, 4]" with each number in its dimension's colour ("[]" for 0-D).
 * `dims` overrides which colour each entry gets (e.g. the original dims a slice kept).
 */
export function ShapeText({ shape, dims }: { shape: number[]; dims?: number[] }) {
  return (
    <code className={styles.shapeText}>
      [
      {shape.map((n, d) => (
        <span key={d}>
          {d > 0 && ', '}
          <Dim d={dims?.[d] ?? d}>{n}</Dim>
        </span>
      ))}
      ]
    </code>
  );
}

/** A 0-D tensor: one number, no dimensions at all. */
export function ScalarBox({ value, name = 'x', state }: { value: number; name?: string; state?: 'result' | 'highlight' }) {
  return (
    <div className={styles.scalarWrap}>
      <div className={styles.viewHeader}>
        <code className={styles.viewName}>{name}</code>
        <span className={styles.viewShape}>shape []</span>
      </div>
      <span className={styles.scalar} data-state={state}>
        {value}
      </span>
    </div>
  );
}

/**
 * A 4-D tensor drawn as a grid of matrices: rows are dim 0, columns dim 1,
 * and each small matrix holds dims 2 and 3.
 */
export function Grid4D({ data, name = 'x', dimNames }: { data: number[][][][]; name?: string; dimNames: string[] }) {
  const shape = [data.length, data[0].length, data[0][0].length, data[0][0][0].length];
  return (
    <div className={styles.grid4}>
      <div className={styles.viewHeader}>
        <code className={styles.viewName}>{name}</code>
        <span className={styles.viewShape}>
          shape <ShapeText shape={shape} />
        </span>
      </div>
      <div className={styles.dimList}>
        {dimNames.map((dn, d) => (
          <Dim key={d} d={d}>
            dim {d}: {dn} ({shape[d]})
          </Dim>
        ))}
      </div>
      <div className="scroll-x">
        <table className={styles.grid4Table}>
          <thead>
            <tr>
              <th />
              {data[0].map((_, h) => (
                <th key={h} scope="col">
                  <Dim d={1}>head {h}</Dim>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, b) => (
              <tr key={b}>
                <th scope="row">
                  <Dim d={0}>batch {b}</Dim>
                </th>
                {row.map((m, h) => (
                  <td key={h}>
                    <code className={styles.miniLabel}>
                      {name}[<Dim d={0}>{b}</Dim>, <Dim d={1}>{h}</Dim>]
                    </code>
                    <div className={styles.miniGrid} style={{ gridTemplateColumns: `repeat(${m[0].length}, auto)` }}>
                      {m.flat().map((v, k) => (
                        <span key={k} className={styles.miniCell}>
                          {Number.isInteger(v) ? v : v.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

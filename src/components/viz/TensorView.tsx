import styles from './TensorView.module.css';

/** A nested array of numbers of depth 1, 2 or 3. */
export type Tensor1D = number[];
export type Tensor2D = number[][];
export type Tensor3D = number[][][];
export type TensorData = Tensor1D | Tensor2D | Tensor3D;

export type CellState = 'normal' | 'highlight' | 'dim' | 'result';

interface Props {
  data: TensorData;
  /** Name shown above, e.g. "x". */
  name?: string;
  /** Optional meaning of each dimension, e.g. ["batch", "tokens", "emb"]. */
  dimNames?: string[];
  /** Visual state per element, given its full index (e.g. [b, t, d]). */
  cellState?: (index: number[]) => CellState;
  onCellClick?: (index: number[]) => void;
  digits?: number;
  /** Colour each dimension's axis label with the dimension palette. */
  colorDims?: boolean;
}

export const shapeOf = (t: TensorData): number[] =>
  Array.isArray(t[0]) ? [t.length, ...shapeOf(t[0] as TensorData)] : [t.length];

/**
 * Draws a small tensor so its shape is visible:
 * - 1-D: a single row of cells
 * - 2-D: a grid (rows × columns)
 * - 3-D: a row of 2-D grids, one per index of the first dimension, each
 *   labelled x[0], x[1], … so "a stack of matrices" is literal on screen.
 */
export function TensorView({ data, name = 'x', dimNames, cellState, onCellClick, digits = 1, colorDims = true }: Props) {
  const shape = shapeOf(data);
  const rank = shape.length;

  const cell = (v: number, index: number[]) => {
    const state = cellState?.(index) ?? 'normal';
    const Tag = onCellClick ? 'button' : 'span';
    return (
      <Tag
        key={index.join(',')}
        className={styles.cell}
        data-state={state}
        onClick={onCellClick ? () => onCellClick(index) : undefined}
        aria-label={onCellClick ? `${name}[${index.join(', ')}] = ${v}` : undefined}
      >
        {Number.isInteger(v) ? v : v.toFixed(digits)}
      </Tag>
    );
  };

  const grid = (m: Tensor2D, prefix: number[]) => (
    <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${m[0]?.length ?? 0}, auto)` }}>
      {m.map((row, i) => row.map((v, j) => cell(v, [...prefix, i, j])))}
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <code className={styles.name}>{name}</code>
        <span className={styles.shape}>
          shape [
          {shape.map((n, d) => (
            <span key={d}>
              {d > 0 && ', '}
              <span className={styles.dim} data-dim={colorDims ? d : undefined}>
                {n}
              </span>
            </span>
          ))}
          ]
        </span>
      </div>
      {dimNames && (
        <div className={styles.dimNames}>
          {dimNames.map((dn, d) => (
            <span key={d} className={styles.dimName} data-dim={colorDims ? d : undefined}>
              dim {d}: {dn} ({shape[d]})
            </span>
          ))}
        </div>
      )}

      <div className="scroll-x">
        {rank === 1 && (
          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${shape[0]}, auto)` }}>
            {(data as Tensor1D).map((v, i) => cell(v, [i]))}
          </div>
        )}
        {rank === 2 && grid(data as Tensor2D, [])}
        {rank === 3 && (
          <div className={styles.stack}>
            {(data as Tensor3D).map((m, b) => (
              <div key={b} className={styles.slice}>
                <code className={styles.sliceLabel} data-dim={colorDims ? 0 : undefined}>
                  {name}[{b}]
                </code>
                {grid(m, [b])}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

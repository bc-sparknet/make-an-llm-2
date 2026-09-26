import styles from './widgets.module.css';

/**
 * A compact tensor drawing for this chapter's widgets (1-D row, 2-D grid,
 * 3-D row of grids). Like the shared TensorView, but a little narrower so two
 * 3×4 slices fit side by side on a phone, and with extra cell states for
 * "squashed group", "max winner" and "broadcast copy".
 */

export type Nested = number | Nested[];
export type MiniCellState = 'normal' | 'group' | 'win' | 'faded' | 'out' | 'copy';

export const shapeOfNested = (t: Nested): number[] => (Array.isArray(t) ? [t.length, ...shapeOfNested(t[0])] : []);

/** Builds a nested array of the given shape from a function of the index. */
export function build(shape: number[], f: (index: number[]) => number, prefix: number[] = []): Nested {
  if (shape.length === 0) return f(prefix);
  return Array.from({ length: shape[0] }, (_, i) => build(shape.slice(1), f, [...prefix, i]));
}

export function at(t: Nested, index: number[]): number {
  return index.reduce<Nested>((acc, i) => (acc as Nested[])[i], t) as number;
}

/** All indices of a shape in row-major order. */
export function allIndices(shape: number[]): number[][] {
  if (shape.length === 0) return [[]];
  const rest = allIndices(shape.slice(1));
  return Array.from({ length: shape[0] }, (_, i) => rest.map((r) => [i, ...r])).flat();
}

/** Integers as-is; otherwise rounded to `digits` places without trailing zeros (6.5, 2.33). */
export const formatNum = (v: number, digits = 2) => {
  const f = 10 ** digits;
  return String(Math.round(v * f) / f).replace('-', '−');
};

interface Props {
  data: Nested;
  name: string;
  /** Palette slot (0, 1, 2) for each axis of the shape; null = uncoloured. */
  dimColors?: (number | null)[];
  cellState?: (index: number[]) => MiniCellState;
  onCellClick?: (index: number[]) => void;
  digits?: number;
  /** Optional note after the shape, e.g. "(keepdim)". */
  note?: string;
}

export function MiniTensor({ data, name, dimColors, cellState, onCellClick, digits = 2, note }: Props) {
  const shape = shapeOfNested(data);
  const rank = shape.length;

  const cell = (index: number[]) => {
    const v = at(data, index);
    const state = cellState?.(index) ?? 'normal';
    const label = `${name}[${index.join(', ')}] = ${formatNum(v, digits)}`;
    if (onCellClick) {
      return (
        <button
          key={index.join(',')}
          className={styles.mCell}
          data-state={state}
          onClick={() => onCellClick(index)}
          aria-label={label}
        >
          {formatNum(v, digits)}
        </button>
      );
    }
    return (
      <span key={index.join(',')} className={styles.mCell} data-state={state}>
        {formatNum(v, digits)}
      </span>
    );
  };

  const grid = (rows: number, cols: number, prefix: number[]) => (
    <div className={styles.mGrid} style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
      {Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => cell([...prefix, i, j])))}
    </div>
  );

  return (
    <div className={styles.mWrap}>
      <div className={styles.mHeader}>
        <code className={styles.mName}>{name}</code>
        <span className={styles.mShape}>
          [
          {shape.map((n, d) => (
            <span key={d}>
              {d > 0 && ', '}
              <span data-dim={dimColors?.[d] ?? undefined}>{n}</span>
            </span>
          ))}
          ]
        </span>
        {note && <span className={styles.mNote}>{note}</span>}
      </div>
      {rank === 0 && <div className={styles.mGrid}>{formatNum(data as number, digits)}</div>}
      {rank === 1 && (
        <div className={styles.mGrid} style={{ gridTemplateColumns: `repeat(${shape[0]}, auto)` }}>
          {Array.from({ length: shape[0] }, (_, i) => cell([i]))}
        </div>
      )}
      {rank === 2 && grid(shape[0], shape[1], [])}
      {rank === 3 && (
        <div className={styles.mStack}>
          {Array.from({ length: shape[0] }, (_, b) => (
            <div key={b} className={styles.mSlice}>
              <code className={styles.mSliceLabel} data-dim={dimColors?.[0] ?? undefined}>
                {name}[{b}]
              </code>
              {grid(shape[1], shape[2], [b])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

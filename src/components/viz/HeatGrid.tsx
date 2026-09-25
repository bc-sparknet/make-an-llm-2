import type { Matrix } from '../../lib/math';
import { fmt } from '../../lib/math';
import styles from './viz.module.css';

interface Props {
  data: Matrix;
  rowLabels?: string[];
  colLabels?: string[];
  /** Values mapped to the colour scale; defaults to the data's own min/max. */
  min?: number;
  max?: number;
  digits?: number;
  /** Highlight one row (e.g. the query currently selected). */
  highlightRow?: number;
  onRowClick?: (row: number) => void;
  /** Hide numbers and show only colour (useful for bigger grids on phones). */
  hideValues?: boolean;
}

/**
 * Renders a matrix as a grid of coloured cells. Cell colour interpolates
 * between --heat-low and --heat-high; −∞ cells are shown hatched.
 */
export function HeatGrid({
  data,
  rowLabels,
  colLabels,
  min,
  max,
  digits = 2,
  highlightRow,
  onRowClick,
  hideValues,
}: Props) {
  const finite = data.flat().filter(Number.isFinite);
  const lo = min ?? Math.min(...finite);
  const hi = max ?? Math.max(...finite);
  const intensity = (v: number) => (hi === lo ? 0.5 : Math.min(1, Math.max(0, (v - lo) / (hi - lo))));

  return (
    <div className="scroll-x">
      <table className={styles.heatGrid} data-col-labels={!!colLabels}>
        {colLabels && (
          <thead>
            <tr>
              {rowLabels && <th />}
              {colLabels.map((c, j) => (
                <th key={j} scope="col" className={styles.colLabel}>
                  <span>{c}</span>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              data-highlight={highlightRow === i}
              onClick={onRowClick ? () => onRowClick(i) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {rowLabels && (
                <th scope="row" className={styles.rowLabel}>
                  {rowLabels[i]}
                </th>
              )}
              {row.map((v, j) => {
                const masked = !Number.isFinite(v);
                const t = masked ? 0 : intensity(v);
                return (
                  <td
                    key={j}
                    className={styles.cell}
                    data-masked={masked}
                    style={{
                      background: masked
                        ? undefined
                        : `color-mix(in srgb, var(--heat-high) ${Math.round(t * 100)}%, var(--heat-low))`,
                      color: t > 0.6 ? 'var(--on-accent)' : undefined,
                    }}
                    title={fmt(v, 3)}
                  >
                    {hideValues ? '' : fmt(v, digits)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

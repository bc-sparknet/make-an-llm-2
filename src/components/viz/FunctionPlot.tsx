import { useId } from 'react';
import styles from './viz.module.css';

export interface PlotSeries {
  label: string;
  fn: (x: number) => number;
  color: string;
}

interface Props {
  series: PlotSeries[];
  xRange: [number, number];
  yRange: [number, number];
  /** Optional x position to mark with a vertical guide. */
  markerX?: number;
  height?: number;
}

/** A responsive SVG line plot of one or more functions. */
export function FunctionPlot({ series, xRange, yRange, markerX, height = 220 }: Props) {
  const clipId = useId();
  const W = 400;
  const H = height;
  const pad = 28;
  const [x0, x1] = xRange;
  const [y0, y1] = yRange;
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - y0) / (y1 - y0)) * (H - 2 * pad);

  const path = (fn: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = x0 + ((x1 - x0) * i) / 200;
      const y = Math.min(y1 + 1, Math.max(y0 - 1, fn(x)));
      pts.push(`${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label={series.map((s) => s.label).join(' vs ')}>
        <defs>
          <clipPath id={clipId}>
            <rect x={pad} y={pad} width={W - 2 * pad} height={H - 2 * pad} />
          </clipPath>
        </defs>
        {/* axes */}
        <line x1={pad} x2={W - pad} y1={sy(0)} y2={sy(0)} className={styles.axis} />
        <line x1={sx(0)} x2={sx(0)} y1={pad} y2={H - pad} className={styles.axis} />
        <text x={W - pad} y={sy(0) - 6} className={styles.tick} textAnchor="end">x</text>
        <text x={pad} y={H - 8} className={styles.tick}>{x0}</text>
        <text x={W - pad} y={H - 8} className={styles.tick} textAnchor="end">{x1}</text>
        <text x={sx(0) + 4} y={pad + 4} className={styles.tick}>{y1}</text>
        {markerX !== undefined && (
          <line x1={sx(markerX)} x2={sx(markerX)} y1={pad} y2={H - pad} className={styles.marker} />
        )}
        <g clipPath={`url(#${clipId})`}>
          {series.map((s) => (
            <path key={s.label} d={path(s.fn)} stroke={s.color} className={styles.line} />
          ))}
          {markerX !== undefined &&
            series.map((s) => (
              <circle key={s.label} cx={sx(markerX)} cy={sy(s.fn(markerX))} r={4.5} fill={s.color} />
            ))}
        </g>
      </svg>
      <div className={styles.legend}>
        {series.map((s) => (
          <span key={s.label}>
            <span className={styles.swatch} style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

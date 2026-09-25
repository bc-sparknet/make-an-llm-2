import styles from './viz.module.css';

interface Props {
  labels: string[];
  values: number[];
  /** Index to emphasise (e.g. the sampled or target token). */
  highlight?: number;
  /** Fraction formatting; default shows a percentage. */
  format?: (v: number) => string;
  /** Scale bars to this maximum instead of 1. */
  max?: number;
}

/** Horizontal bar chart for probability distributions. */
export function ProbabilityBars({ labels, values, highlight, format, max = 1 }: Props) {
  const show = format ?? ((v: number) => `${(v * 100).toFixed(1)}%`);
  return (
    <div className={styles.bars} role="list">
      {labels.map((label, i) => (
        <div key={i} className={styles.barRow} role="listitem" data-highlight={highlight === i}>
          <span className={styles.barLabel}>{label}</span>
          <span className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${Math.max(0, (values[i] / max) * 100)}%` }} />
          </span>
          <span className={styles.barValue}>{show(values[i])}</span>
        </div>
      ))}
    </div>
  );
}

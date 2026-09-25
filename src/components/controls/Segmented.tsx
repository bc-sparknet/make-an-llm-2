import styles from './controls.module.css';

interface Props<T extends string> {
  label?: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of mutually-exclusive toggle buttons. */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className={styles.segmentedWrap}>
      {label && <span className={styles.segmentedLabel}>{label}</span>}
      <div className={styles.segmented} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={o.value === value}
            className={styles.segment}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

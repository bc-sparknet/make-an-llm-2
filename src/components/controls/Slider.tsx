import { useId } from 'react';
import styles from './controls.module.css';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Custom display of the current value (defaults to the number itself). */
  format?: (value: number) => string;
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: Props) {
  const id = useId();
  return (
    <div className={styles.slider}>
      <label htmlFor={id} className={styles.sliderLabel}>
        <span>{label}</span>
        <output htmlFor={id} className={styles.value}>
          {format ? format(value) : value}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

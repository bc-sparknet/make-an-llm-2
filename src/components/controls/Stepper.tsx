import { useEffect, useState } from 'react';
import styles from './controls.module.css';

/**
 * State for step-through animations: current step, prev/next, and autoplay.
 * `total` is the number of steps (step indices run 0 … total-1).
 */
export function useStepper(total: number, intervalMs = 1200) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Clamp if the number of steps shrinks (e.g. a slider changed the input).
  useEffect(() => {
    if (step > total - 1) setStep(Math.max(0, total - 1));
  }, [step, total]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), intervalMs);
    return () => clearTimeout(t);
  }, [playing, step, total, intervalMs]);

  return {
    step,
    total,
    playing,
    setStep,
    prev: () => setStep((s) => Math.max(0, s - 1)),
    next: () => setStep((s) => Math.min(total - 1, s + 1)),
    reset: () => {
      setPlaying(false);
      setStep(0);
    },
    togglePlay: () => {
      if (step >= total - 1) setStep(0);
      setPlaying((p) => !p);
    },
  };
}

type StepperState = ReturnType<typeof useStepper>;

interface Props {
  stepper: StepperState;
  /** Optional label for the current step, e.g. "Merge 3 of 8". */
  label?: string;
}

export function StepControls({ stepper, label }: Props) {
  const { step, total, playing, prev, next, reset, togglePlay } = stepper;
  return (
    <div className={styles.stepControls}>
      <button className={styles.stepButton} onClick={reset} aria-label="Reset" disabled={step === 0 && !playing}>
        ⟲
      </button>
      <button className={styles.stepButton} onClick={prev} aria-label="Previous step" disabled={step === 0}>
        ‹
      </button>
      <button className={`${styles.stepButton} ${styles.play}`} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <button className={styles.stepButton} onClick={next} aria-label="Next step" disabled={step >= total - 1}>
        ›
      </button>
      <span className={styles.stepLabel} aria-live="polite">
        {label ?? `Step ${step + 1} of ${total}`}
      </span>
    </div>
  );
}

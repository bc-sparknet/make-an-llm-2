import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import styles from './widgets.module.css';

/**
 * Illustrative gradient magnitudes in a 5-layer network, with and without
 * shortcut connections. Bars use a log scale because the "off" values span
 * several orders of magnitude. Numbers are made up to show the typical
 * pattern, not measured from a particular model.
 */

type Mode = 'off' | 'on';

// Mean absolute gradient of each layer's weights (layer 1 = nearest the input).
const GRADS: Record<Mode, number[]> = {
  off: [0.00018, 0.00041, 0.0016, 0.0062, 0.021],
  on: [0.19, 0.24, 0.17, 0.31, 1.12],
};

const LOG_MIN = -4; // 1e-4 → empty bar
const LOG_MAX = 0.5; // ~3.2 → full bar

function width(g: number) {
  const t = (Math.log10(g) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return Math.max(2, Math.min(100, t * 100));
}

function show(g: number) {
  return g >= 0.01 ? g.toFixed(2) : g.toExponential(1).replace('e-', '×10⁻').replace(/⁻(\d)/, (_, d) => '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
}

export function ShortcutDemo() {
  const [mode, setMode] = useState<Mode>('off');
  const grads = GRADS[mode];

  return (
    <Figure
      title="Gradients through 5 layers"
      caption="Illustrative numbers, log-scale bars. Gradients start at the loss and flow backwards, from layer 5 towards layer 1. Without shortcuts they shrink at every layer; with shortcuts every layer still gets a usable signal."
    >
      <Segmented
        label="Shortcut connections"
        options={[
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <div className={styles.gradList}>
        {grads.map((g, i) => (
          <div key={i} className={styles.gradRow}>
            <span className={styles.gradLabel}>
              Layer {i + 1}
              {i === 0 ? ' (first)' : i === grads.length - 1 ? ' (last)' : ''}
            </span>
            <span className={styles.gradTrack}>
              <span className={styles.gradFill} data-mode={mode} style={{ width: `${width(g)}%` }} />
            </span>
            <span className={styles.gradValue}>{show(g)}</span>
          </div>
        ))}
      </div>
      <p className={styles.note}>
        {mode === 'off'
          ? 'The first layer receives a gradient about 100× smaller than the last one, so it barely learns.'
          : 'Adding each layer’s input back to its output gives the gradient a direct path, so early layers keep learning.'}
      </p>
    </Figure>
  );
}

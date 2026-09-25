import { useState } from 'react';
import { Figure, FunctionPlot, Slider } from '../../components';
import { fmt, gelu, relu } from '../../lib/math';
import styles from './widgets.module.css';

/** GELU and ReLU on the same axes, with a movable x marker. */
export function GeluPlot() {
  const [x, setX] = useState(-0.8);

  return (
    <Figure
      title="GELU vs ReLU"
      caption="Far from zero the two curves agree. Near zero, GELU bends smoothly and lets small negative inputs through as small negative outputs (its minimum is about −0.17 near x ≈ −0.75), whereas ReLU cuts them to exactly 0."
    >
      <FunctionPlot
        series={[
          { label: 'GELU', fn: gelu, color: 'var(--accent)' },
          { label: 'ReLU', fn: relu, color: 'var(--blue)' },
        ]}
        xRange={[-3, 3]}
        yRange={[-1, 3]}
        markerX={x}
      />
      <Slider label="x" value={x} min={-3} max={3} step={0.05} onChange={setX} format={(v) => v.toFixed(2)} />
      <div className={styles.statRow}>
        <div className={styles.stat} data-tone="accent">
          <span>GELU(x)</span>
          <b>{fmt(gelu(x), 3)}</b>
        </div>
        <div className={styles.stat} data-tone="blue">
          <span>ReLU(x)</span>
          <b>{fmt(relu(x), 3)}</b>
        </div>
      </div>
    </Figure>
  );
}

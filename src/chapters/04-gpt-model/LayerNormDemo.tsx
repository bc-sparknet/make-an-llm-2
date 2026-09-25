import { useState } from 'react';
import { Figure, Slider } from '../../components';
import { fmt, layerNorm, mean, variance } from '../../lib/math';
import styles from './widgets.module.css';

/**
 * A five-number "embedding" the learner can edit. Shows the raw values and
 * the layer-normalised output side by side, with mean/variance readouts, plus
 * the learnable scale (γ) and shift (β) applied afterwards.
 */

const INITIAL = [2, -1, 4, 0.5, 3.5];

interface BarsProps {
  values: number[];
  scale: number;
  tone: 'blue' | 'accent';
}

/** Vertical bars that grow up for positive values and down for negative ones. */
export function DivergingBars({ values, scale, tone }: BarsProps) {
  return (
    <div className={styles.divBars} data-tone={tone}>
      {values.map((v, i) => {
        const h = Math.min(50, (Math.abs(v) / scale) * 50);
        return (
          <div key={i} className={styles.divCol}>
            <div className={styles.divTrack}>
              <span
                className={styles.divFill}
                style={{ height: `${h}%`, top: v >= 0 ? `${50 - h}%` : '50%' }}
              />
            </div>
            <span className={styles.divValue}>{fmt(v, 2)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LayerNormDemo() {
  const [values, setValues] = useState(INITIAL);
  const [gamma, setGamma] = useState(1);
  const [beta, setBeta] = useState(0);

  const normed = layerNorm(values);
  const out = normed.map((v) => gamma * v + beta);
  const rawScale = Math.max(1, ...values.map(Math.abs));
  const outScale = Math.max(2.5, ...out.map(Math.abs));

  const setAt = (i: number, v: number) => setValues(values.map((x, j) => (j === i ? v : x)));

  return (
    <Figure
      title="Layer normalization, live"
      caption="Drag the inputs: however you set them, the normalised output always has mean 0 and variance 1 (until you change γ or β, which the model learns during training)."
    >
      <div className={styles.twoPanels}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Input</div>
          <DivergingBars values={values} scale={rawScale} tone="blue" />
          <div className={styles.readouts}>
            <span>mean <b>{fmt(mean(values))}</b></span>
            <span>var <b>{fmt(variance(values))}</b></span>
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Output</div>
          <DivergingBars values={out} scale={outScale} tone="accent" />
          <div className={styles.readouts}>
            <span>mean <b>{fmt(mean(out))}</b></span>
            <span>var <b>{fmt(variance(out))}</b></span>
          </div>
        </div>
      </div>

      <div className={styles.sliderGrid}>
        {values.map((v, i) => (
          <Slider key={i} label={`x${'₁₂₃₄₅'[i]}`} value={v} min={-5} max={5} step={0.5} onChange={(n) => setAt(i, n)} />
        ))}
      </div>
      <div className={styles.sliderGrid}>
        <Slider label="scale γ" value={gamma} min={0} max={2} step={0.1} onChange={setGamma} format={(g) => g.toFixed(1)} />
        <Slider label="shift β" value={beta} min={-2} max={2} step={0.1} onChange={setBeta} format={(b) => b.toFixed(1)} />
      </div>
    </Figure>
  );
}

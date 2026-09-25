import { useState } from 'react';
import { Figure, ProbabilityBars, Slider } from '../../components';
import { softmax } from '../../lib/math';
import styles from './SamplingPlayground.module.css';

/**
 * Fixed, illustrative next-token logits. Temperature rescales them before the
 * softmax; top-k masks everything outside the k largest to −∞ (probability 0).
 * "Sample" draws one token; "Draw 100" builds a histogram of draws.
 */

const PROMPT = 'The keeper climbed the';
const TOKENS = ['stairs', 'ladder', 'tower', 'hill', 'steps', 'rocks', 'wall', 'mast', 'moon', 'banana'];
const LOGITS = [4.1, 3.2, 2.7, 2.5, 2.2, 1.4, 1.0, 0.3, -0.6, -1.8];

function distribution(temperature: number, k: number) {
  const threshold = [...LOGITS].sort((a, b) => b - a)[k - 1];
  const masked = LOGITS.map((l) => (l >= threshold ? l : -Infinity));
  return softmax(masked, temperature);
}

function draw(probs: number[]) {
  let r = Math.random();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0 && probs[i] > 0) return i;
  }
  // Floating-point leftovers: fall back to the last non-zero entry.
  return probs.reduce((last, p, i) => (p > 0 ? i : last), 0);
}

export function SamplingPlayground() {
  const [temperature, setTemperature] = useState(1);
  const [k, setK] = useState(TOKENS.length);
  const [samples, setSamples] = useState<{ i: number; p: number }[]>([]);
  const [hist, setHist] = useState<{ key: string; counts: number[] } | null>(null);

  const probs = distribution(temperature, k);
  const key = `${temperature}|${k}`;
  const counts = hist && hist.key === key ? hist.counts : null;
  const last = samples.length ? samples[samples.length - 1].i : undefined;

  const sampleOnce = () => {
    const i = draw(probs);
    setSamples((s) => [...s.slice(-11), { i, p: probs[i] }]);
  };
  const sampleMany = () => {
    const c = TOKENS.map(() => 0);
    for (let i = 0; i < 100; i++) c[draw(probs)]++;
    setHist({ key, counts: c });
  };

  return (
    <Figure
      title="Sampling playground"
      caption="Logits are illustrative. Low temperature approaches greedy decoding; high temperature flattens the distribution. Top-k removes the long tail of unlikely tokens before sampling."
    >
      <p className={styles.prompt}>
        {PROMPT} <span className={styles.blank}>{last === undefined ? '____' : TOKENS[last]}</span>
      </p>

      <Slider
        label="Temperature"
        value={temperature}
        min={0.1}
        max={3}
        step={0.1}
        onChange={setTemperature}
        format={(v) => v.toFixed(1)}
      />
      <Slider
        label="Top-k"
        value={k}
        min={1}
        max={TOKENS.length}
        onChange={setK}
        format={(v) => (v === TOKENS.length ? `${v} (off)` : String(v))}
      />

      <ProbabilityBars labels={TOKENS} values={probs} highlight={last} />

      <div className={styles.buttons}>
        <button className={styles.primary} onClick={sampleOnce}>
          Sample
        </button>
        <button className={styles.secondary} onClick={sampleMany}>
          Draw 100
        </button>
        <button className={styles.secondary} onClick={() => setSamples([])} disabled={!samples.length}>
          Clear
        </button>
      </div>

      <div className={styles.history} aria-live="polite">
        {samples.length === 0 ? (
          <span className={styles.muted}>Your samples will appear here.</span>
        ) : (
          samples.map((s, i) => (
            <span key={i} className={styles.chip} data-rare={s.p < 0.05}>
              {TOKENS[s.i]}
            </span>
          ))
        )}
      </div>

      {counts && (
        <div className={styles.histogram}>
          <p className={styles.histTitle}>Counts over 100 draws</p>
          <ProbabilityBars
            labels={TOKENS}
            values={counts}
            max={Math.max(...counts)}
            format={(v) => String(v)}
          />
        </div>
      )}
    </Figure>
  );
}

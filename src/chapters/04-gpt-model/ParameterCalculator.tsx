import { useState } from 'react';
import { Figure, Segmented, Slider } from '../../components';
import styles from './widgets.module.css';

/**
 * Counts the trainable parameters of a GPT-2-style model for any config.
 *
 * Assumptions (they match the architecture built in this chapter and the
 * released GPT-2 weights):
 *   - Token embedding: vocab × d.  Positional embedding: context × d.
 *   - Attention per block: Q, K, V projections d×d each WITH bias (qkv_bias = true,
 *     as in GPT-2), plus an output projection d×d with bias.
 *     → 4·d² + 4·d.  The number of heads does NOT change this count; it only
 *     decides how the d dimensions are split up.
 *   - Feed-forward per block: d → 4d → d, both with bias → 8·d² + 5·d.
 *   - Two LayerNorms per block + one final LayerNorm, each with scale and
 *     shift vectors → 2·d parameters each.
 *   - Output head: d × vocab, no bias. With weight tying it reuses the token
 *     embedding matrix, so it adds nothing.
 *   - Dropout has no parameters.
 *
 * GPT-2 small (d=768, 12 layers, 1024 context, 50,257 vocab) gives
 * 163,037,184 untied and 124,439,808 tied, the latter matching the published
 * checkpoint. Memory assumes 4 bytes per parameter (float32), 1 MB = 1024² bytes.
 */

const EMB_MIN = 64;
const EMB_MAX = 2048;
const CONTEXTS = [128, 256, 512, 1024, 2048, 4096, 8192];
const VOCABS = [1000, 5000, 16000, 32000, 50257, 65536, 100277, 128000];

interface Config {
  d: number;
  layers: number;
  heads: number;
  ctx: number;
  vocab: number;
}

const PRESETS: Record<string, Config> = {
  small: { d: 768, layers: 12, heads: 12, ctx: 1024, vocab: 50257 },
  medium: { d: 1024, layers: 24, heads: 16, ctx: 1024, vocab: 50257 },
  large: { d: 1280, layers: 36, heads: 20, ctx: 1024, vocab: 50257 },
  xl: { d: 1600, layers: 48, heads: 25, ctx: 1024, vocab: 50257 },
};

function divisors(n: number): number[] {
  const out: number[] = [];
  for (let h = 1; h <= Math.min(n, 64); h++) if (n % h === 0) out.push(h);
  return out;
}

function countParams({ d, layers, ctx, vocab }: Config, tied: boolean) {
  const embeddings = vocab * d + ctx * d;
  const attention = layers * (4 * d * d + 4 * d);
  const ffn = layers * (8 * d * d + 5 * d);
  const norms = (2 * layers + 1) * 2 * d;
  const head = tied ? 0 : d * vocab;
  const total = embeddings + attention + ffn + norms + head;
  return { embeddings, attention, ffn, norms, head, total };
}

function short(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function nearestIndex(list: number[], v: number) {
  let best = 0;
  list.forEach((x, i) => {
    if (Math.abs(x - v) < Math.abs(list[best] - v)) best = i;
  });
  return best;
}

export function ParameterCalculator() {
  const [cfg, setCfg] = useState<Config>(PRESETS.small);
  const [tied, setTied] = useState(false);

  const preset = Object.keys(PRESETS).find((k) => {
    const p = PRESETS[k];
    return p.d === cfg.d && p.layers === cfg.layers && p.heads === cfg.heads && p.ctx === cfg.ctx && p.vocab === cfg.vocab;
  });

  const headOptions = divisors(cfg.d);
  const setD = (d: number) => {
    // Keep the head count valid: pick the divisor of d closest to the old value.
    const opts = divisors(d);
    setCfg({ ...cfg, d, heads: opts[nearestIndex(opts, cfg.heads)] });
  };

  const p = countParams(cfg, tied);
  const mb = (p.total * 4) / 1024 ** 2;
  const rows = [
    { label: 'Embeddings (token + position)', value: p.embeddings },
    { label: `Attention (×${cfg.layers})`, value: p.attention },
    { label: `Feed-forward (×${cfg.layers})`, value: p.ffn },
    { label: 'LayerNorms', value: p.norms },
    { label: tied ? 'Output head (tied, reused)' : 'Output head', value: p.head },
  ];

  return (
    <Figure
      title="Parameter calculator"
      caption={
        <>
          Assumes GPT-2’s layout: biases on the Q/K/V projections, a 4× feed-forward layer and no bias on the output
          head. The number of heads doesn’t change the count, only how the embedding is split. Memory is for the weights
          alone at 4 bytes each; training needs several times more.
        </>
      }
    >
      <Segmented
        label="Preset"
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'xl', label: 'XL' },
          ...(preset ? [] : [{ value: 'custom', label: 'Custom' }]),
        ]}
        value={preset ?? 'custom'}
        onChange={(k) => k !== 'custom' && setCfg(PRESETS[k])}
      />

      <div className={styles.calcTotal}>
        <div>
          <span className={styles.calcBig}>{p.total.toLocaleString('en-US')}</span>
          <span className={styles.calcSub}>parameters ≈ {short(p.total)}</span>
        </div>
        <div className={styles.calcMem}>
          <b>{mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`}</b>
          <span>float32</span>
        </div>
      </div>

      <div className={styles.breakdown}>
        {rows.map((r) => (
          <div key={r.label} className={styles.breakRow}>
            <span className={styles.breakLabel}>{r.label}</span>
            <span className={styles.breakValue}>{short(r.value)}</span>
            <span className={styles.breakTrack}>
              <span className={styles.breakFill} style={{ width: `${(r.value / p.total) * 100}%` }} />
            </span>
          </div>
        ))}
      </div>

      <Segmented
        label="Weight tying (output head reuses token embeddings)"
        options={[
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On' },
        ]}
        value={tied ? 'on' : 'off'}
        onChange={(v) => setTied(v === 'on')}
      />

      <div className={styles.sliderGrid}>
        <Slider label="emb_dim" value={cfg.d} min={EMB_MIN} max={EMB_MAX} step={64} onChange={setD} />
        <Slider label="n_layers" value={cfg.layers} min={1} max={64} onChange={(layers) => setCfg({ ...cfg, layers })} />
        <Slider
          label="n_heads"
          value={nearestIndex(headOptions, cfg.heads)}
          min={0}
          max={headOptions.length - 1}
          onChange={(i) => setCfg({ ...cfg, heads: headOptions[i] })}
          format={(i) => String(headOptions[i])}
        />
        <Slider
          label="context"
          value={nearestIndex(CONTEXTS, cfg.ctx)}
          min={0}
          max={CONTEXTS.length - 1}
          onChange={(i) => setCfg({ ...cfg, ctx: CONTEXTS[i] })}
          format={(i) => CONTEXTS[i].toLocaleString('en-US')}
        />
        <Slider
          label="vocab"
          value={nearestIndex(VOCABS, cfg.vocab)}
          min={0}
          max={VOCABS.length - 1}
          onChange={(i) => setCfg({ ...cfg, vocab: VOCABS[i] })}
          format={(i) => VOCABS[i].toLocaleString('en-US')}
        />
      </div>
      <p className={styles.calcHint}>
        Each head works on emb_dim / n_heads = {cfg.d} / {cfg.heads} = {cfg.d / cfg.heads} dimensions. Only divisors of
        emb_dim are allowed.
      </p>
    </Figure>
  );
}

import { useState } from 'react';
import { Figure, StepControls, useStepper } from '../../components';
import styles from './widgets.module.css';

/**
 * Layer norm on a [3, 4] tensor (3 tokens × emb_dim 4), one reduction at a
 * time. The side column shows the [3, 1] keepdim result (mean, then variance);
 * tapping a row follows that token's arithmetic.
 */

const H = [
  [2, 4, 6, 8],
  [1, 1, 1, 5],
  [10, 0, 5, 5],
];
const EPS = 1e-5;

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const MU = H.map(mean);
const CENTERED = H.map((r, i) => r.map((v) => v - MU[i]));
const VAR = CENTERED.map((r) => mean(r.map((v) => v * v)));
const NORMED = CENTERED.map((r, i) => r.map((v) => v / Math.sqrt(VAR[i] + EPS)));

const fmt = (v: number, digits = 2) => {
  const r = Math.round(v * 100) / 100;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(digits);
  return s === '-0' ? '0' : s.replace('-', '−');
};
const list = (v: number[]) => `[${v.map((x) => fmt(x)).join(', ')}]`;

interface Stage {
  title: string;
  code: string;
  matrix: number[][];
  matrixName: string;
  side?: { name: string; values: number[] };
  explain: (t: number) => string;
}

const STAGES: Stage[] = [
  {
    title: 'Start: 3 token vectors',
    code: 'h.shape  # [3, 4]: 3 tokens, emb_dim 4',
    matrix: H,
    matrixName: 'h',
    explain: (t) =>
      `Token ${t} is the row ${list(H[t])}. Layer norm will only ever look at these 4 numbers together.`,
  },
  {
    title: '1. Mean over dim=−1',
    code: 'mu = h.mean(dim=-1, keepdim=True)  # [3, 1]',
    matrix: H,
    matrixName: 'h',
    side: { name: 'mu', values: MU },
    explain: (t) => `(${H[t].join(' + ')}) / 4 = ${fmt(MU[t])}. One mean per token, kept as a [3, 1] column.`,
  },
  {
    title: '2. Subtract (broadcast [3, 1] across 4)',
    code: 'centered = h - mu  # [3, 4] - [3, 1]',
    matrix: CENTERED,
    matrixName: 'centered',
    side: { name: 'mu', values: MU },
    explain: (t) =>
      `${list(H[t])} − ${fmt(MU[t])} = ${list(CENTERED[t])}. The token's own mean is copied along its row and subtracted from all 4 numbers.`,
  },
  {
    title: '3. Variance over dim=−1',
    code: 'var = centered.pow(2).mean(dim=-1, keepdim=True)  # [3, 1]',
    matrix: CENTERED,
    matrixName: 'centered',
    side: { name: 'var', values: VAR },
    explain: (t) =>
      `(${CENTERED[t].map((v) => `${fmt(v)}²`).join(' + ')}) / 4 = ${fmt(VAR[t])}. Again one number per token.`,
  },
  {
    title: '4. Divide by √(var + eps)',
    code: 'normed = centered / torch.sqrt(var + 1e-5)',
    matrix: NORMED,
    matrixName: 'normed',
    side: { name: 'var', values: VAR },
    explain: (t) =>
      `${list(CENTERED[t])} / √${fmt(VAR[t])} = ${list(NORMED[t])}. Each token is scaled by its own spread.`,
  },
  {
    title: '5. Check: every row has mean 0, variance 1',
    code: 'normed.mean(dim=-1), normed.var(dim=-1, unbiased=False)',
    matrix: NORMED,
    matrixName: 'normed',
    side: { name: 'mean', values: NORMED.map(mean) },
    explain: (t) =>
      `Token ${t}: mean ${fmt(mean(NORMED[t]))}, variance ${fmt(mean(NORMED[t].map((v) => v * v)))}. Tokens with very different spreads (variance ${fmt(VAR[1])} vs ${fmt(VAR[2])}) now sit on the same scale.`,
  },
];

export function LayerNormStepper() {
  const stepper = useStepper(STAGES.length, 1800);
  const [token, setToken] = useState(0);
  const stage = STAGES[stepper.step];
  const cols = `auto repeat(4, minmax(46px, 1fr)) minmax(52px, 1fr)`;

  return (
    <Figure
      title="Layer norm, one reduction at a time"
      caption="Every reduction runs over dim=−1, so the side column always has one number per token (shape [3, 1] thanks to keepdim). Tap a row to follow another token: no step ever mixes numbers from different rows."
    >
      <div className={styles.root}>
        <p className={styles.stageTitle}>{stage.title}</p>
        <code className={styles.codeLine}>{stage.code}</code>

        <div className="scroll-x">
          <div className={styles.lnGrid} style={{ gridTemplateColumns: cols }}>
            <span className={styles.lnHead} />
            <span className={styles.lnHead} style={{ gridColumn: '2 / span 4' }}>
              {stage.matrixName} · emb dim (dim −1) →
            </span>
            <span className={styles.lnHead}>{stage.side?.name ?? ''}</span>
            {stage.matrix.map((row, t) => (
              <div key={t} className={styles.lnRow}>
                <span className={styles.lnTok} data-focus={t === token}>
                  tok {t}
                </span>
                {row.map((v, j) => (
                  <button
                    key={j}
                    className={styles.lnCell}
                    data-focus={t === token}
                    onClick={() => setToken(t)}
                    aria-label={`Follow token ${t}`}
                  >
                    {fmt(v)}
                  </button>
                ))}
                <button
                  className={styles.lnSide}
                  data-focus={t === token}
                  data-empty={!stage.side}
                  onClick={() => setToken(t)}
                  aria-label={`Follow token ${t}`}
                  tabIndex={stage.side ? 0 : -1}
                >
                  {stage.side ? fmt(stage.side.values[t]) : ''}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formula} aria-live="polite">
          <span>{stage.explain(token)}</span>
        </div>

        <StepControls stepper={stepper} label={`Step ${stepper.step + 1} of ${STAGES.length}`} />
      </div>
    </Figure>
  );
}

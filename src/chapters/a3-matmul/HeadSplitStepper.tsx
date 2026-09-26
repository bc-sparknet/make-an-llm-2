import type { CSSProperties } from 'react';
import { Figure, StepControls, useStepper } from '../../components';
import styles from './widgets.module.css';

/**
 * A [1, 4, 6] query tensor (4 tokens, d_out = 6) split into 2 heads of 3 and
 * merged back, one line of code per step. Numbers are coloured by the head
 * their column belongs to, so you can watch the columns regroup per head.
 */

const HEAD_COLOURS = ['var(--accent)', 'var(--blue)'];
type Meaning = 'batch' | 'tokens' | 'heads' | 'feat';
const MEANING_CLASS: Record<Meaning, string> = {
  batch: styles.dBatch,
  tokens: styles.dTokens,
  heads: styles.dHeads,
  feat: styles.dFeat,
};

interface Step {
  code: string;
  shape: number[];
  dims: [string, Meaning][];
  /** Label for slice s (the 2nd dim), or a single label for 3-D tensors. */
  sliceLabel: (s: number) => string;
  /** Value at [s, r, c] within the slice (null = not a traced number). */
  value: (s: number, r: number, c: number) => number | null;
  /** Head a cell belongs to. */
  head: (s: number, r: number, c: number) => number;
  text: string;
}

const flat = (t: number, d: number) => t * 6 + d;
const headOf = (v: number) => Math.floor((v % 6) / 3);

const whole = (name: string, text: string, code: string): Step => ({
  code,
  shape: [1, 4, 6],
  dims: [
    ['batch', 'batch'],
    ['tokens', 'tokens'],
    ['d_out', 'feat'],
  ],
  sliceLabel: () => `${name}[0]`,
  value: (_s, r, c) => flat(r, c),
  head: (_s, _r, c) => Math.floor(c / 3),
  text,
});

const perToken = (name: string, text: string, code: string): Step => ({
  code,
  shape: [1, 4, 2, 3],
  dims: [
    ['batch', 'batch'],
    ['tokens', 'tokens'],
    ['heads', 'heads'],
    ['head_dim', 'feat'],
  ],
  sliceLabel: (t) => `${name}[0, ${t}] · token ${t}`,
  value: (t, h, e) => flat(t, h * 3 + e),
  head: (_t, h) => h,
  text,
});

const perHead = (name: string, text: string, code: string): Step => ({
  code,
  shape: [1, 2, 4, 3],
  dims: [
    ['batch', 'batch'],
    ['heads', 'heads'],
    ['tokens', 'tokens'],
    ['head_dim', 'feat'],
  ],
  sliceLabel: (h) => `${name}[0, ${h}] · head ${h}`,
  value: (h, t, e) => flat(t, h * 3 + e),
  head: (h) => h,
  text,
});

const STEPS: Step[] = [
  whole(
    'q',
    'The queries for 4 tokens, 6 numbers each. Columns 0–2 will become head 0, columns 3–5 head 1. Nothing is split yet: the colours are a promise.',
    'q = self.to_q(x)',
  ),
  perToken(
    'q',
    'view cuts each token’s 6 numbers into 2 groups of 3. The reading order is unchanged (0, 1, 2, …), so this is a free view. But tokens are still the outer dim.',
    'q = q.view(1, 4, 2, 3)',
  ),
  perHead(
    'q',
    'transpose(1, 2) swaps the tokens and heads dims. Now each slice is one head: 4 tokens × 3 numbers, holding only that head’s columns. Read the numbers: 0 1 2, then 6 7 8. The order has jumped.',
    'q = q.transpose(1, 2)',
  ),
  {
    code: 'scores = q @ k.transpose(2, 3)',
    shape: [1, 2, 4, 4],
    dims: [
      ['batch', 'batch'],
      ['heads', 'heads'],
      ['tokens', 'tokens'],
      ['tokens', 'tokens'],
    ],
    sliceLabel: (h) => `scores[0, ${h}] · head ${h}`,
    value: () => null,
    head: (h) => h,
    text: 'With heads as a batch dim, @ runs one (4×3) @ (3×4) per head: [1, 2, 4, 3] @ [1, 2, 3, 4] → [1, 2, 4, 4]. Each head gets its own tokens × tokens score grid.',
  },
  perHead(
    'out',
    'After softmax, weights @ v gives [1, 2, 4, 4] @ [1, 2, 4, 3] → [1, 2, 4, 3]: the same shape as v. (To keep the numbers traceable, pretend out holds v’s numbers.)',
    'out = weights @ v',
  ),
  perToken(
    'out',
    'Merging starts by swapping back: tokens outer, heads inner. Each token now holds its head-0 result and head-1 result. Memory still has the per-head order, so this is not contiguous.',
    'out = out.transpose(1, 2)',
  ),
  whole(
    'out',
    'contiguous() copies into reading order, then view glues the 2 × 3 back into 6. Each token’s row is its head-0 output next to its head-1 output: that’s the concatenation.',
    'out = out.contiguous().view(1, 4, 6)',
  ),
];

function Cell({ v, head }: { v: number | null; head: number }) {
  return (
    <span className={styles.hcell} style={{ '--hc': HEAD_COLOURS[head] } as CSSProperties}>
      {v ?? ''}
    </span>
  );
}

export function HeadSplitStepper() {
  const stepper = useStepper(STEPS.length, 2600);
  const s = STEPS[stepper.step];
  const rank = s.shape.length;
  const slices = rank === 3 ? 1 : s.shape[1];
  const rows = rank === 3 ? s.shape[1] : s.shape[2];
  const cols = rank === 3 ? s.shape[2] : s.shape[3];

  return (
    <Figure
      title="Splitting and merging attention heads"
      caption="view regroups numbers without moving them; transpose changes which dim is outer. Splitting heads is view then transpose; merging is the exact reverse, with contiguous() in between."
    >
      <div className={styles.legend}>
        <span>
          <span className={styles.swatch} style={{ '--hc': HEAD_COLOURS[0] } as CSSProperties} />
          head 0 (columns 0–2)
        </span>
        <span>
          <span className={styles.swatch} style={{ '--hc': HEAD_COLOURS[1] } as CSSProperties} />
          head 1 (columns 3–5)
        </span>
      </div>

      <code className={styles.codeLine}>{s.code}</code>

      <p className={styles.shapeLine}>
        shape [
        {s.shape.map((n, d) => (
          <span key={d}>
            {d > 0 && ', '}
            <span className={MEANING_CLASS[s.dims[d][1]]}>{n}</span>
          </span>
        ))}
        ]
      </p>
      <div className={styles.dimNames}>
        {s.dims.map(([name, meaning], d) => (
          <span key={d} className={MEANING_CLASS[meaning]}>
            dim {d}: {name}
          </span>
        ))}
      </div>

      <div className={styles.stage}>
        {Array.from({ length: slices }, (_, si) => (
          <div key={si} className={styles.slice}>
            <span className={styles.sliceLabel}>{s.sliceLabel(si)}</span>
            <div className={styles.mat} style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
              {Array.from({ length: rows * cols }, (_, k) => {
                const r = Math.floor(k / cols);
                const c = k % cols;
                const v = s.value(si, r, c);
                return <Cell key={k} v={v} head={v === null ? s.head(si, r, c) : headOf(v)} />;
              })}
            </div>
          </div>
        ))}
      </div>

      <p className={styles.explain} aria-live="polite">
        {s.text}
      </p>

      <StepControls stepper={stepper} label={`Step ${stepper.step + 1} of ${STEPS.length}`} />
    </Figure>
  );
}

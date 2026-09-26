import { useState } from 'react';
import { Figure, StepControls, useStepper } from '../../components';
import { MiniTensor, build } from './MiniTensor';
import styles from './widgets.module.css';

/**
 * Broadcasting in three steps: align the shapes from the right, pad missing
 * dims with 1, then stretch every size-1 dim. The operand(s) that get
 * stretched are drawn with their real values (orange) and the virtual copies
 * (dashed), so "copied across the batch" is literally visible.
 */

interface Preset {
  id: string;
  label: string;
  a: number[];
  b: number[];
  op: string;
  note: string;
  /** Values of each operand as a function of its own index. */
  aVal: (i: number[]) => number;
  bVal: (i: number[]) => number;
}

const PRESETS: Preset[] = [
  {
    id: 'bias',
    label: '[3,4] + [4]',
    a: [3, 4],
    b: [4],
    op: '+',
    note: 'A bias vector added to every row.',
    aVal: () => 0,
    bVal: ([j]) => (j + 1) * 10,
  },
  {
    id: 'pos',
    label: '[2,3,4] + [3,4]',
    a: [2, 3, 4],
    b: [3, 4],
    op: '+',
    note: 'tok_emb [batch, tokens, emb] + pos_emb [tokens, emb]: the same position vectors for every text.',
    aVal: () => 0,
    bVal: ([t]) => t + 1,
  },
  {
    id: 'keep',
    label: '[2,3,4] − [2,3,1]',
    a: [2, 3, 4],
    b: [2, 3, 1],
    op: '−',
    note: 'x − x.mean(dim=−1, keepdim=True): one number per token, stretched along the vector.',
    aVal: () => 0,
    bVal: ([bb, t]) => bb * 3 + t + 1,
  },
  {
    id: 'both',
    label: '[3,1] + [1,4]',
    a: [3, 1],
    b: [1, 4],
    op: '+',
    note: 'Both operands stretch: a column plus a row makes a table.',
    aVal: ([i]) => i + 1,
    bVal: ([, j]) => (j + 1) * 10,
  },
  {
    id: 'bad',
    label: '[3,4] + [3]',
    a: [3, 4],
    b: [3],
    op: '+',
    note: 'Meant as "one number per row", but alignment starts from the right.',
    aVal: () => 0,
    bVal: ([j]) => j + 1,
  },
];

type Status = 'match' | 'stretchA' | 'stretchB' | 'missingA' | 'missingB' | 'bad';

function analyse(a: number[], b: number[]) {
  const n = Math.max(a.length, b.length);
  const padA = [...Array(n - a.length).fill(null), ...a] as (number | null)[];
  const padB = [...Array(n - b.length).fill(null), ...b] as (number | null)[];
  const status: Status[] = padA.map((x, i) => {
    const y = padB[i];
    if (x === null) return 'missingA';
    if (y === null) return 'missingB';
    if (x === y) return 'match';
    if (x === 1) return 'stretchA';
    if (y === 1) return 'stretchB';
    return 'bad';
  });
  const ok = !status.includes('bad');
  const result = padA.map((x, i) => Math.max(x ?? 1, padB[i] ?? 1));
  return { n, padA, padB, status, ok, result };
}

const STATUS_TEXT: Record<Status, (step: number) => string> = {
  match: () => 'match',
  stretchA: () => 'stretch A',
  stretchB: () => 'stretch B',
  missingA: (s) => (s === 0 ? 'A missing' : 'stretch A'),
  missingB: (s) => (s === 0 ? 'B missing' : 'stretch B'),
  bad: () => '✗ clash',
};

const STEP_LABELS = ['1. Align from the right', '2. Treat missing dims as 1', '3. Stretch the size-1 dims'];

export function BroadcastVisualizer() {
  const [presetId, setPresetId] = useState('pos');
  const preset = PRESETS.find((p) => p.id === presetId)!;
  const stepper = useStepper(3, 1600);
  const step = stepper.step;
  const { n, padA, padB, status, ok, result } = analyse(preset.a, preset.b);

  const sizeKind = (v: number | null, s: Status, which: 'A' | 'B') => {
    if (s === 'bad') return 'bad';
    if (v === null) return step === 0 ? 'missing' : 'padded';
    if (step === 2 && s === `stretch${which}`) return 'stretch';
    return undefined;
  };

  // Operands whose shape differs from the result get drawn, padded and stretched.
  const operands = [
    { name: 'A', shape: preset.a, padded: padA, val: preset.aVal },
    { name: 'B', shape: preset.b, padded: padB, val: preset.bVal },
  ].filter((o) => !ok || o.shape.length !== n || o.shape.some((s, i) => s !== result[n - o.shape.length + i]));
  const shown = ok ? operands : operands.filter((o) => o.name === 'B');

  const picture = (o: (typeof operands)[number]) => {
    const own = (full: number[]) => full.slice(n - o.shape.length).map((v, i) => (o.shape[i] === 1 ? 0 : v));
    if (step === 0) {
      return <MiniTensor key={o.name} name={o.name} data={build(o.shape, o.val)} note="as stored" />;
    }
    const padShape = o.padded.map((v) => v ?? 1);
    if (step === 1 || !ok) {
      return (
        <MiniTensor
          key={o.name}
          name={o.name}
          data={build(padShape, (full) => o.val(own(full)))}
          note={padShape.length > o.shape.length ? 'missing dims as 1' : 'no dims missing'}
        />
      );
    }
    // Step 2: stretched to the result shape. A cell is an original if every
    // stretched coordinate is 0; otherwise it's a (virtual) copy.
    const stretched = padShape.map((v, i) => v === 1 && result[i] !== 1);
    return (
      <MiniTensor
        key={o.name}
        name={o.name}
        data={build(result, (full) => o.val(own(full)))}
        cellState={(full) => (full.every((v, i) => !stretched[i] || v === 0) ? 'group' : 'copy')}
        note="after stretching"
      />
    );
  };

  const cols = `auto repeat(${n}, minmax(52px, auto))`;
  const row = (label: string, values: (number | null)[], which: 'A' | 'B') => (
    <>
      <span className={styles.bcRowLabel}>{label}</span>
      {values.map((v, i) => (
        <span key={i} className={styles.bcSize} data-kind={sizeKind(v, status[i], which)}>
          {v === null ? (step === 0 ? '·' : '1') : v}
        </span>
      ))}
    </>
  );

  return (
    <Figure
      title="Broadcasting, step by step"
      caption="Shapes are compared column by column from the right. Equal sizes pass; a size of 1 (or a missing dim, which counts as 1) is stretched by repeating the values; anything else is an error. The dashed cells are the copies, which PyTorch never actually stores."
    >
      <div className={styles.root}>
        <div className={styles.presets} role="group" aria-label="Shape pair">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={styles.preset}
              aria-pressed={p.id === presetId}
              onClick={() => {
                setPresetId(p.id);
                stepper.reset();
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className={`${styles.muted} ${styles.small}`}>{preset.note}</p>

        <p className={styles.stageTitle}>{STEP_LABELS[step]}</p>
        <div className="scroll-x">
          <div className={styles.bcTable} style={{ gridTemplateColumns: cols }}>
            {row(`A [${preset.a.join(', ')}]`, padA, 'A')}
            {row(`B [${preset.b.join(', ')}]`, padB, 'B')}
            <span className={styles.bcRowLabel} />
            {status.map((s, i) => (
              <span key={i} className={styles.bcStatus} data-status={s === 'bad' ? 'bad' : s === 'match' ? 'match' : 'stretch'}>
                {STATUS_TEXT[s](step)}
              </span>
            ))}
            {step === 2 && (
              <>
                <span className={styles.bcRule} />
                <span className={styles.bcRowLabel}>{ok ? `A ${preset.op} B` : 'result'}</span>
                {result.map((v, i) => (
                  <span key={i} className={styles.bcSize} data-kind={ok ? 'result' : status[i] === 'bad' ? 'bad' : undefined}>
                    {ok ? v : status[i] === 'bad' ? '✗' : '?'}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        <div className={styles.stack}>{shown.map(picture)}</div>

        {step === 2 && ok && (
          <>
            <div className={styles.legend}>
              <span>
                <span className={styles.swatch} data-state="group" /> stored values
              </span>
              <span>
                <span className={styles.swatch} data-state="copy" /> broadcast copies
              </span>
            </div>
            <p className={styles.ok}>
              Result shape <strong>[{result.join(', ')}]</strong>: every element of A now has a partner in B.
            </p>
          </>
        )}
        {step === 2 && !ok && (
          <p className={styles.error}>
            RuntimeError: The size of tensor a ({padA[status.indexOf('bad')]}) must match the size of tensor b (
            {padB[status.indexOf('bad')]}) at non-singleton dimension {status.indexOf('bad')}
          </p>
        )}

        <StepControls stepper={stepper} label={`Step ${step + 1} of 3`} />
      </div>
    </Figure>
  );
}

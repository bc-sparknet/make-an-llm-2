import type { ReactNode } from 'react';
import { Figure, HeatGrid, StepControls, useStepper } from '../../components';
import type { Matrix } from '../../lib/math';
import { EMBEDDINGS, TOKENS, attention, headWeights } from './attention';
import styles from './ScaledAttentionStepper.module.css';

/**
 * Step-through of scaled dot-product attention on four tokens with
 * d_in = 3 and d_out = 2: X → Q, K, V → scores → scaled → softmax → context.
 */

const PICK = [1, 2, 4, 5];
const WORDS = PICK.map((i) => TOKENS[i]);
const X = PICK.map((i) => EMBEDDINGS[i]);
const { Wq, Wk, Wv } = headWeights(3, 2, 7, 1.2);
const A = attention(X, Wq, Wk, Wv);
const D_K = 2;

const dims = (n: number) => Array.from({ length: n }, (_, i) => `d${i + 1}`);

function Mat({ label, data, cols, hideRows, min, max }: { label: string; data: Matrix; cols: string[]; hideRows?: boolean; min?: number; max?: number }) {
  return (
    <div className={styles.mat}>
      <div className={styles.matLabel}>
        {label} <span className={styles.shape}>{data.length}×{data[0].length}</span>
      </div>
      <HeatGrid data={data} rowLabels={hideRows ? undefined : WORDS} colLabels={cols} min={min} max={max} />
    </div>
  );
}

interface Step {
  title: string;
  formula: string;
  text: string;
  view: ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'Input embeddings',
    formula: 'X',
    text: 'One row per token, one column per embedding dimension. This is what the attention layer receives.',
    view: <Mat label="X" data={X} cols={dims(3)} />,
  },
  {
    title: 'Project to queries, keys, values',
    formula: 'Q = X·W_q   K = X·W_k   V = X·W_v',
    text: 'Three trainable matrices (3×2 here) turn each embedding into a query, a key and a value. Same input, three different roles.',
    view: (
      <div className={styles.row}>
        <Mat label="Q" data={A.Q} cols={dims(2)} />
        <Mat label="K" data={A.K} cols={dims(2)} hideRows />
        <Mat label="V" data={A.V} cols={dims(2)} hideRows />
      </div>
    ),
  },
  {
    title: 'Attention scores',
    formula: 'Q · Kᵀ',
    text: 'Row i holds query i dotted with every key. Rows are queries (who is looking), columns are keys (who is being looked at).',
    view: <Mat label="scores" data={A.scores} cols={WORDS} />,
  },
  {
    title: 'Scale',
    formula: 'Q · Kᵀ / √d_k',
    text: `Divide by √${D_K} ≈ ${Math.sqrt(D_K).toFixed(2)}. With realistic key sizes (64 or more) this keeps scores from growing so big that softmax saturates.`,
    view: <Mat label="scaled" data={A.scaled} cols={WORDS} />,
  },
  {
    title: 'Softmax each row',
    formula: 'A = softmax(scaled)',
    text: 'Each row becomes a set of positive weights that sum to 1: how much each query attends to each key.',
    view: <Mat label="weights A" data={A.weights} cols={WORDS} min={0} max={1} />,
  },
  {
    title: 'Context vectors',
    formula: 'Z = A · V',
    text: 'Each output row is a weighted mix of the value rows. Four tokens in, four context vectors out, now of size d_out = 2.',
    view: <Mat label="Z" data={A.context} cols={dims(2)} />,
  },
];

export function ScaledAttentionStepper() {
  const stepper = useStepper(STEPS.length, 2200);
  const s = STEPS[stepper.step];

  return (
    <Figure
      title="Scaled dot-product attention, step by step"
      caption="Four tokens, 3-D embeddings, 2-D queries/keys/values. The weight matrices are seeded random numbers standing in for trained ones."
    >
      <ol className={styles.track} aria-hidden="true">
        {STEPS.map((st, i) => (
          <li key={st.title} data-state={i < stepper.step ? 'done' : i === stepper.step ? 'active' : 'todo'} />
        ))}
      </ol>
      <div className={styles.panel} key={stepper.step}>
        <h4 className={styles.title}>{s.title}</h4>
        <code className={styles.formula}>{s.formula}</code>
        <p className={styles.text}>{s.text}</p>
        {s.view}
      </div>
      <StepControls stepper={stepper} label={`Step ${stepper.step + 1} of ${STEPS.length}`} />
    </Figure>
  );
}

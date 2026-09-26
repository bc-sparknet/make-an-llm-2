import { useState } from 'react';
import { Figure, TensorView, type TensorData } from '../../components';
import { ShapeText } from './TensorBits';
import { build } from './tensorUtils';
import styles from './widgets.module.css';

/**
 * Adds and removes size-1 dimensions around three token IDs. The numbers never
 * change; only the brackets around them (the shape) do.
 */

const IDS = [15496, 11, 314]; // GPT-2 token IDs for "Hello, I"
const MAX_RANK = 3; // TensorView draws up to 3-D

type Op = { label: string; apply: (shape: number[]) => number[] | null };

const unsqueeze = (d: number) => (s: number[]) => {
  if (s.length >= MAX_RANK) return null;
  const pos = d < 0 ? s.length + 1 + d : d;
  return [...s.slice(0, pos), 1, ...s.slice(pos)];
};

const OPS: Op[] = [
  { label: 'unsqueeze(0)', apply: unsqueeze(0) },
  { label: 'unsqueeze(1)', apply: unsqueeze(1) },
  { label: 'unsqueeze(-1)', apply: unsqueeze(-1) },
  { label: 'squeeze(0)', apply: (s) => (s[0] === 1 ? s.slice(1) : s) },
  { label: 'squeeze()', apply: (s) => s.filter((n) => n !== 1) },
];

export function UnsqueezeDemo() {
  const [history, setHistory] = useState<{ op: string; shape: number[] }[]>([]);
  const shape = history.length ? history[history.length - 1].shape : [3];
  const data = build(shape, IDS) as TensorData;

  // An op is available when it would actually change the shape.
  const result = (op: Op) => {
    const next = op.apply(shape);
    return next && next.join() !== shape.join() ? next : null;
  };
  const run = (op: Op) => {
    const next = result(op);
    if (next) setHistory((h) => [...h, { op: op.label, shape: next }].slice(-6));
  };

  return (
    <Figure
      title="Adding and removing size-1 dimensions"
      caption="unsqueeze(d) inserts a new dimension of size 1 at position d; squeeze removes size-1 dimensions. The three IDs and their order never change, only how many brackets wrap them. (The demo stops at 3 dimensions.)"
    >
      <div className={styles.presets}>
        {OPS.map((op) => (
          <button key={op.label} className={styles.preset} onClick={() => run(op)} disabled={!result(op)}>
            <code>{op.label}</code>
          </button>
        ))}
        <button className={styles.preset} onClick={() => setHistory([])} disabled={history.length === 0}>
          reset
        </button>
      </div>

      <div className={styles.unsqView}>
        <TensorView name="ids" data={data} />
      </div>

      <p className={styles.meaning}>
        ids has shape <ShapeText shape={shape} />: {describe(shape)}
      </p>

      <pre className={styles.log}>
        <code>
          {'ids = torch.tensor([15496, 11, 314])  # [3]\n'}
          {history.map((h) => `ids = ids.${h.op}`.padEnd(38) + `# [${h.shape.join(', ')}]\n`).join('')}
        </code>
      </pre>
    </Figure>
  );
}

function describe(shape: number[]): string {
  const key = shape.join(',');
  const known: Record<string, string> = {
    '3': 'a plain list of 3 token IDs.',
    '1,3': 'a batch holding 1 sequence of 3 tokens. This is what a GPT model expects.',
    '3,1': '3 rows of 1 ID each: a column instead of a row.',
    '1,1,3': 'a batch of 1, containing 1 row, of 3 IDs.',
    '1,3,1': 'a batch of 1 sequence, where each token holds a 1-number list.',
    '3,1,1': '3 entries, each a 1×1 matrix.',
  };
  return known[key] ?? 'the same 3 numbers with extra size-1 brackets.';
}

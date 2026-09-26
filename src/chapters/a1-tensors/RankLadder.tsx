import { useState } from 'react';
import { Figure, Segmented, TensorView, type TensorData } from '../../components';
import { Grid4D, ScalarBox, ShapeText } from './TensorBits';
import { randomTensor } from './tensorUtils';
import styles from './widgets.module.css';

/** Steps up the ranks: scalar → vector → matrix → 3-D → 4-D, each with an LLM meaning. */

type Rank = '0' | '1' | '2' | '3' | '4';

const OPTIONS = [
  { value: '0', label: '0-D' },
  { value: '1', label: '1-D' },
  { value: '2', label: '2-D' },
  { value: '3', label: '3-D' },
  { value: '4', label: '4-D' },
] as const;

const STEPS: Record<Rank, { name: string; shape: number[]; dims: string[]; meaning: string; code: string }> = {
  '0': {
    name: 'Scalar',
    shape: [],
    dims: [],
    meaning: 'A single number with no dimensions. Example: the loss after one training step.',
    code: 'loss = torch.tensor(3.7)',
  },
  '1': {
    name: 'Vector',
    shape: [4],
    dims: ['emb_dim'],
    meaning: "A list of numbers. Example: one token's embedding, 4 features long (GPT-2 uses 768).",
    code: 'emb = torch.rand(4)',
  },
  '2': {
    name: 'Matrix',
    shape: [3, 4],
    dims: ['tokens', 'emb_dim'],
    meaning: 'A list of vectors. Example: one sentence of 3 tokens, one row per token.',
    code: 'sent = torch.rand(3, 4)',
  },
  '3': {
    name: '3-D tensor',
    shape: [2, 3, 4],
    dims: ['batch', 'tokens', 'emb_dim'],
    meaning: 'A list of matrices. Example: a batch of 2 sentences, each one a matrix like the last step. This is the shape flowing through a GPT model.',
    code: 'x = torch.rand(2, 3, 4)',
  },
  '4': {
    name: '4-D tensor',
    shape: [2, 2, 3, 2],
    dims: ['batch', 'heads', 'tokens', 'head_dim'],
    meaning: 'A grid of matrices. Example: multi-head attention, which gives every sentence in the batch several heads, each with its own tokens × head_dim matrix.',
    code: 'q = torch.rand(2, 2, 3, 2)',
  },
};

// Built once so each step always shows the same numbers.
const DATA: Record<Rank, unknown> = {
  '0': 3.7,
  '1': randomTensor([4], 11),
  '2': randomTensor([3, 4], 11),
  '3': randomTensor([2, 3, 4], 11),
  '4': randomTensor([2, 2, 3, 2], 5),
};

export function RankLadder() {
  const [rank, setRank] = useState<Rank>('1');
  const step = STEPS[rank];
  const r = Number(rank);

  return (
    <Figure
      title="The rank ladder"
      caption="Each rung is a list of the rung before it. The number of dimensions (the rank, or ndim) is how many numbers the shape has, and how many indices you need to reach a single number."
    >
      <Segmented label="Number of dimensions" options={OPTIONS} value={rank} onChange={setRank} />

      <div className={styles.ladderHead}>
        <strong>{step.name}</strong>
        <span className={styles.muted}>
          ndim = {r}, shape <ShapeText shape={step.shape} />
        </span>
      </div>

      <div className={styles.ladderView}>
        {r === 0 && <ScalarBox name="loss" value={DATA['0'] as number} />}
        {r >= 1 && r <= 3 && (
          <TensorView name={step.code.split(' ')[0]} data={DATA[rank] as TensorData} dimNames={step.dims} />
        )}
        {r === 4 && <Grid4D name="q" data={DATA['4'] as number[][][][]} dimNames={step.dims} />}
      </div>

      <p className={styles.meaning}>{step.meaning}</p>
      <code className={styles.codeLine}>{step.code}</code>
    </Figure>
  );
}

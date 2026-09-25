import { Figure, StepControls, useStepper } from '../../components';
import styles from './widgets.module.css';

/**
 * Step-through of one transformer block. The two dashed rails on the left are
 * the shortcut paths: each one carries the block's input around a sub-layer
 * and into the matching "add" node.
 */

interface Node {
  id: string;
  label: string;
  kind: 'io' | 'norm' | 'attn' | 'ffn' | 'drop' | 'add';
  detail: string;
}

const INPUT: Node = {
  id: 'in',
  label: 'Input  [batch, tokens, 768]',
  kind: 'io',
  detail: 'One 768-number vector per token arrives, either from the embeddings or from the previous block.',
};

const GROUP_1: Node[] = [
  { id: 'ln1', label: 'LayerNorm 1', kind: 'norm', detail: 'Rescale each token vector to mean 0, variance 1 so attention sees well-behaved inputs.' },
  { id: 'mha', label: 'Masked multi-head attention', kind: 'attn', detail: 'Each token gathers information from itself and earlier tokens (Chapter 3). This is the only place tokens talk to each other.' },
  { id: 'd1', label: 'Dropout', kind: 'drop', detail: 'During training, randomly zero some values so the model can’t lean on any single feature.' },
  { id: 'add1', label: '⊕ Add shortcut', kind: 'add', detail: 'Add the original input (dashed rail) back in. The sub-layer only has to learn a correction.' },
];

const GROUP_2: Node[] = [
  { id: 'ln2', label: 'LayerNorm 2', kind: 'norm', detail: 'Normalise again before the feed-forward network.' },
  { id: 'ffn', label: 'Feed-forward (768 → 3072 → 768)', kind: 'ffn', detail: 'Each token is processed on its own: expand 4×, apply GELU, project back down.' },
  { id: 'd2', label: 'Dropout', kind: 'drop', detail: 'Another round of random zeroing (training only).' },
  { id: 'add2', label: '⊕ Add shortcut', kind: 'add', detail: 'Add the result of the first half back in via the second shortcut.' },
];

const OUTPUT: Node = {
  id: 'out',
  label: 'Output  [batch, tokens, 768]',
  kind: 'io',
  detail: 'Same shape as the input, so blocks can be stacked: GPT-2 small repeats this 12 times.',
};

const ORDER: Node[] = [INPUT, ...GROUP_1, ...GROUP_2, OUTPUT];

export function TransformerBlockDiagram() {
  const stepper = useStepper(ORDER.length, 1600);
  const active = ORDER[stepper.step];
  const idx = (n: Node) => ORDER.indexOf(n);

  const renderNode = (n: Node) => {
    const i = idx(n);
    const state = i === stepper.step ? 'active' : i < stepper.step ? 'done' : 'todo';
    return (
      <li key={n.id} className={styles.blockItem}>
        <button className={styles.blockNode} data-kind={n.kind} data-state={state} onClick={() => stepper.setStep(i)}>
          {n.label}
        </button>
      </li>
    );
  };

  // A rail lights up while data is travelling along it (from the input until its add node).
  const railState = (start: number, end: number) =>
    stepper.step >= start && stepper.step <= end ? 'active' : stepper.step > end ? 'done' : 'todo';

  return (
    <Figure
      title="Inside a transformer block"
      caption="Tap any box or press play. The dashed rails on the left are the shortcut connections."
    >
      <ol className={styles.blockDiagram}>
        {renderNode(INPUT)}
        <li className={styles.blockGroup} data-state={railState(0, idx(GROUP_1[3]))}>
          <span className={styles.railLabel}>shortcut</span>
          <ol>{GROUP_1.map(renderNode)}</ol>
        </li>
        <li className={styles.blockGroup} data-state={railState(idx(GROUP_1[3]), idx(GROUP_2[3]))}>
          <span className={styles.railLabel}>shortcut</span>
          <ol>{GROUP_2.map(renderNode)}</ol>
        </li>
        {renderNode(OUTPUT)}
      </ol>
      <p className={styles.detail} key={stepper.step}>
        <strong>{active.label.split('  ')[0].replace('⊕ ', '')}.</strong> {active.detail}
      </p>
      <StepControls stepper={stepper} label={`${stepper.step + 1} / ${ORDER.length}`} />
    </Figure>
  );
}

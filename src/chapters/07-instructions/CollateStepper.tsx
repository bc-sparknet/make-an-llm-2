import { Figure, StepControls, useStepper } from '../../components';
import styles from './CollateStepper.module.css';

/**
 * Walks three tiny token-ID sequences through the custom collate function:
 * append <|endoftext|>, pad, shift into inputs/targets, replace padding in
 * the targets with -100 (keeping the first end-of-text), and optionally mask
 * the instruction tokens too.
 */

const EOT = 50256;
const IGNORE = -100;

type Kind = 'prompt' | 'resp' | 'eot' | 'pad' | 'ignore';
interface Cell {
  v: number;
  kind: Kind;
}

// Toy IDs. `prompt` = how many leading tokens belong to the instruction part.
const SEQS = [
  { name: 'A', ids: [0, 1, 2, 3, 4], prompt: 2 },
  { name: 'B', ids: [5, 6], prompt: 1 },
  { name: 'C', ids: [7, 8, 9], prompt: 2 },
];

const MAX = Math.max(...SEQS.map((s) => s.ids.length)) + 1;

function raw(s: (typeof SEQS)[number]): Cell[] {
  return s.ids.map((v, i) => ({ v, kind: i < s.prompt ? 'prompt' : 'resp' }));
}
const withEot = (s: (typeof SEQS)[number]): Cell[] => [...raw(s), { v: EOT, kind: 'eot' }];
const padded = (s: (typeof SEQS)[number]): Cell[] => {
  const c = withEot(s);
  return [...c, ...Array.from({ length: MAX - c.length }, (): Cell => ({ v: EOT, kind: 'pad' }))];
};

function targets(s: (typeof SEQS)[number], maskPad: boolean, maskPrompt: boolean): Cell[] {
  return padded(s)
    .slice(1)
    .map((c, j) => {
      if (maskPad && c.kind === 'pad') return { v: IGNORE, kind: 'ignore' };
      // Target j is the token at position j+1; it is part of the instruction if j+1 < prompt.
      if (maskPrompt && j + 1 < s.prompt) return { v: IGNORE, kind: 'ignore' };
      return c;
    });
}

const STEPS = [
  {
    title: 'Raw sequences',
    text: 'Three formatted examples, already tokenised. They have different lengths, so they can’t be stacked yet. Blue tokens come from the prompt, green from the response.',
  },
  {
    title: 'Append <|endoftext|>',
    text: 'Each sequence gets one 50256 at the end. This one is meaningful: it teaches the model where a response should stop.',
  },
  {
    title: 'Pad to the longest in the batch',
    text: `Shorter sequences are filled with more 50256s until every row is ${MAX} long. Only this batch’s longest row matters, not the whole dataset’s.`,
  },
  {
    title: 'Shift into inputs and targets',
    text: 'Inputs drop the last token; targets drop the first. At every position, the target is simply the next token, just like pretraining.',
  },
  {
    title: 'Replace padding in targets with −100',
    text: 'Padding targets become −100 so the loss ignores them. The first 50256 in each row is kept: predicting it is how the model learns to stop.',
  },
  {
    title: 'Optional: mask the instruction',
    text: 'Targets that belong to the prompt can be set to −100 too, so the loss only rewards writing the response. Whether this helps depends on the dataset.',
  },
];

function Row({ name, cells }: { name: string; cells: Cell[] }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowName}>{name}</span>
      {cells.map((c, j) => (
        <span key={j} className={styles.cell} data-kind={c.kind}>
          {c.v === IGNORE ? '−100' : c.v}
        </span>
      ))}
    </div>
  );
}

export function CollateStepper() {
  const stepper = useStepper(STEPS.length, 2200);
  const step = stepper.step;
  const s = STEPS[step];

  return (
    <Figure
      title="Inside the collate function"
      caption="Token IDs 0–9 are placeholders; 50256 is GPT-2's real <|endoftext|> ID. In the real code, rows can also be truncated to an allowed maximum length."
    >
      <div className={`scroll-x ${styles.board}`} key={step}>
        {step < 3 ? (
          <div className={styles.group}>
            <div className={styles.groupLabel}>batch</div>
            {SEQS.map((q) => (
              <Row key={q.name} name={q.name} cells={step === 0 ? raw(q) : step === 1 ? withEot(q) : padded(q)} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.group}>
              <div className={styles.groupLabel}>inputs</div>
              {SEQS.map((q) => (
                <Row key={q.name} name={q.name} cells={padded(q).slice(0, -1)} />
              ))}
            </div>
            <div className={styles.group}>
              <div className={styles.groupLabel}>targets</div>
              {SEQS.map((q) => (
                <Row key={q.name} name={q.name} cells={targets(q, step >= 4, step >= 5)} />
              ))}
            </div>
          </>
        )}
      </div>

      <ul className={styles.legend}>
        <li data-kind="prompt">prompt</li>
        <li data-kind="resp">response</li>
        <li data-kind="eot">end of text</li>
        <li data-kind="pad">padding</li>
        <li data-kind="ignore">ignored</li>
      </ul>

      <p className={styles.detail} key={`d${step}`}>
        <strong>{s.title}.</strong> {s.text}
      </p>
      <StepControls stepper={stepper} label={`Step ${step + 1} of ${STEPS.length}`} />
    </Figure>
  );
}

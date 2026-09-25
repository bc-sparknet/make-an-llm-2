import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import styles from './JudgeDemo.module.css';

/**
 * LLM-as-a-judge, illustrated: pick a test example, see the prompt sent to the
 * judge model, then reveal its score. Scores are hand-written to show typical
 * judge behaviour; they were not produced by a real model run.
 */

interface Example {
  name: string;
  instruction: string;
  reference: string;
  response: string;
  score: number;
  why: string;
}

const EXAMPLES: Example[] = [
  {
    name: 'Units',
    instruction: 'Convert 3 kilometres to metres.',
    reference: '3 kilometres is 3,000 metres.',
    response: '3 kilometres is 3,000 metres.',
    score: 96,
    why: 'Correct and matches the reference exactly.',
  },
  {
    name: 'Antonym',
    instruction: "Give an antonym for 'generous'.",
    reference: "An antonym for 'generous' is 'stingy'.",
    response: "An antonym for 'generous' is 'selfish'.",
    score: 72,
    why: 'A reasonable opposite, but less precise than the reference.',
  },
  {
    name: 'Capital',
    instruction: 'What is the capital of Australia?',
    reference: 'The capital of Australia is Canberra.',
    response: 'The capital of Australia is Sydney.',
    score: 8,
    why: 'Fluent and confident, but factually wrong.',
  },
];

const OPTIONS = EXAMPLES.map((_, i) => ({ value: String(i), label: EXAMPLES[i].name }));

function judgePrompt(e: Example) {
  return `You are grading a model's answer.
Instruction: ${e.instruction}
Reference answer: ${e.reference}
Model answer: ${e.response}
Score the model answer from 0 (useless) to 100 (perfect), using the reference as a guide. Reply with a single integer only.`;
}

export function JudgeDemo() {
  const [idx, setIdx] = useState('0');
  const [revealed, setRevealed] = useState<boolean[]>(() => EXAMPLES.map(() => false));
  const i = Number(idx);
  const e = EXAMPLES[i];
  const shown = EXAMPLES.filter((_, k) => revealed[k]);
  const avg = shown.length ? shown.reduce((s, x) => s + x.score, 0) / shown.length : null;

  return (
    <Figure
      title="An LLM as the judge"
      caption="Scores here are illustrative, written to show typical judge behaviour. A real run sends each prompt to a model such as Llama 3 and parses the integer it returns."
    >
      <Segmented options={OPTIONS} value={idx} onChange={setIdx} />

      <dl className={styles.triple}>
        <div data-kind="instruction">
          <dt>Instruction</dt>
          <dd>{e.instruction}</dd>
        </div>
        <div data-kind="reference">
          <dt>Reference (from the dataset)</dt>
          <dd>{e.reference}</dd>
        </div>
        <div data-kind="response">
          <dt>Our fine-tuned model</dt>
          <dd>{e.response}</dd>
        </div>
      </dl>

      <details className={styles.prompt}>
        <summary>Prompt sent to the judge</summary>
        <pre>{judgePrompt(e)}</pre>
      </details>

      {revealed[i] ? (
        <div className={styles.result} key={i}>
          <div className={styles.scoreLine}>
            <span>Judge score</span>
            <strong>{e.score}</strong>
          </div>
          <div className={styles.track}>
            <span
              className={styles.fill}
              style={{ width: `${e.score}%` }}
              data-band={e.score >= 80 ? 'good' : e.score >= 50 ? 'ok' : 'bad'}
            />
          </div>
          <p className={styles.why}>{e.why}</p>
        </div>
      ) : (
        <button className={styles.ask} onClick={() => setRevealed(revealed.map((r, k) => r || k === i))}>
          Ask the judge
        </button>
      )}

      <p className={styles.average}>
        {avg === null
          ? `Average score: reveal a score to start (0 of ${EXAMPLES.length})`
          : `Average score over ${shown.length} of ${EXAMPLES.length}: ${avg.toFixed(1)}`}
      </p>
    </Figure>
  );
}

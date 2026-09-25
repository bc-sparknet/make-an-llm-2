import { Figure, StepControls, useStepper } from '../../components';
import styles from './PipelineAnimation.module.css';

/**
 * Step-through of the three stages of building an LLM: data → pretraining →
 * fine-tuning. Each stage lights up in turn with a short description.
 */

const STAGES = [
  {
    title: 'Collect text',
    icon: '📚',
    detail:
      'Gather a huge, diverse corpus: web pages, books, code, encyclopedias. GPT-3 was trained on roughly 300 billion tokens.',
  },
  {
    title: 'Pretrain',
    icon: '🧠',
    detail:
      'Train the model to predict the next token over and over. No labels needed: the text itself is the answer key. The result is a "foundation" or "base" model.',
  },
  {
    title: 'Fine-tune',
    icon: '🎯',
    detail:
      'Continue training on a much smaller, labeled dataset for a specific job, such as classifying emails or following instructions.',
  },
  {
    title: 'Use it',
    icon: '💬',
    detail: 'The fine-tuned model can now answer questions, classify text, summarise, translate, or chat.',
  },
];

export function PipelineAnimation() {
  const stepper = useStepper(STAGES.length, 1800);
  const current = STAGES[stepper.step];

  return (
    <Figure title="The stages of building an LLM">
      <ol className={styles.pipeline}>
        {STAGES.map((s, i) => (
          <li key={s.title} className={styles.stage} data-state={i < stepper.step ? 'done' : i === stepper.step ? 'active' : 'todo'}>
            <button className={styles.node} onClick={() => stepper.setStep(i)} aria-label={s.title}>
              <span aria-hidden="true">{s.icon}</span>
            </button>
            <span className={styles.label}>{s.title}</span>
          </li>
        ))}
      </ol>
      <p className={styles.detail} key={stepper.step}>
        <strong>{current.title}.</strong> {current.detail}
      </p>
      <StepControls stepper={stepper} label={`Stage ${stepper.step + 1} of ${STAGES.length}`} />
    </Figure>
  );
}

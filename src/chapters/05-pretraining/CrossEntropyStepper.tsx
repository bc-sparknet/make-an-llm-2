import { Figure, ProbabilityBars, StepControls, useStepper } from '../../components';
import { mean } from '../../lib/math';
import styles from './CrossEntropyStepper.module.css';

/**
 * Walks through cross-entropy one target position at a time: the model's
 * (illustrative) distribution over a tiny vocabulary, the probability it gave
 * the correct next token, −log of that, and finally the average and exp(loss).
 */

const VOCAB = ['the', 'keeper', 'climbed', 'stairs', 'lamp', 'sea', 'and'];

const POSITIONS = [
  { context: 'the', target: 1, probs: [0.08, 0.34, 0.06, 0.12, 0.18, 0.14, 0.08] },
  { context: 'the keeper', target: 2, probs: [0.05, 0.04, 0.52, 0.09, 0.1, 0.06, 0.14] },
  { context: 'the keeper climbed', target: 0, probs: [0.11, 0.03, 0.02, 0.44, 0.16, 0.1, 0.14] },
];

const nll = POSITIONS.map((p) => -Math.log(p.probs[p.target]));
const loss = mean(nll);

export function CrossEntropyStepper() {
  const stepper = useStepper(POSITIONS.length + 1, 2200);
  const { step } = stepper;
  const summary = step === POSITIONS.length;
  const pos = POSITIONS[Math.min(step, POSITIONS.length - 1)];

  return (
    <Figure
      title="Cross-entropy, one position at a time"
      caption="Probabilities are illustrative. The loss only cares about the probability of the correct token; how the rest is spread doesn't matter directly."
    >
      {!summary ? (
        <>
          <p className={styles.context}>
            Input: <span className={styles.input}>{pos.context}</span> → target:{' '}
            <span className={styles.target}>{VOCAB[pos.target]}</span>
          </p>
          <ProbabilityBars labels={VOCAB} values={pos.probs} highlight={pos.target} />
          <p className={styles.calc}>
            p(<b>{VOCAB[pos.target]}</b>) = {pos.probs[pos.target].toFixed(2)} → −log(p) ={' '}
            <b>{nll[step].toFixed(3)}</b>
          </p>
        </>
      ) : (
        <div className={styles.summary}>
          <p className={styles.context}>Average over all target positions:</p>
          <p className={styles.formula}>
            loss = ({nll.map((v) => v.toFixed(3)).join(' + ')}) / {nll.length} = <b>{loss.toFixed(3)}</b>
          </p>
          <p className={styles.formula}>
            perplexity = exp({loss.toFixed(3)}) = <b>{Math.exp(loss).toFixed(2)}</b>
          </p>
          <p className={styles.note}>
            The model is, on average, about as unsure as if it were choosing uniformly among ~{Math.exp(loss).toFixed(1)}{' '}
            tokens.
          </p>
        </div>
      )}

      <ol className={styles.tally}>
        {POSITIONS.map((p, i) => (
          <li key={i} data-state={i < step || summary ? 'done' : i === step ? 'active' : 'todo'}>
            <span className={styles.tallyToken}>{VOCAB[p.target]}</span>
            <span className={styles.tallyValue}>{i <= step ? nll[i].toFixed(2) : '…'}</span>
          </li>
        ))}
        <li data-state={summary ? 'active' : 'todo'} className={styles.tallyLoss}>
          <span className={styles.tallyToken}>loss</span>
          <span className={styles.tallyValue}>{summary ? loss.toFixed(2) : '…'}</span>
        </li>
      </ol>

      <StepControls
        stepper={stepper}
        label={summary ? 'Average → loss' : `Position ${step + 1} of ${POSITIONS.length}`}
      />
    </Figure>
  );
}

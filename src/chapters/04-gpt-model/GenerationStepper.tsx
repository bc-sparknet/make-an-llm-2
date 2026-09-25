import { useState } from 'react';
import { Figure, ProbabilityBars, Segmented, StepControls, TokenChips, useStepper } from '../../components';
import { fmt, softmax } from '../../lib/math';
import styles from './widgets.module.css';

/**
 * The greedy generation loop on a toy example. Each iteration has three
 * phases: (1) crop the context and run the model, (2) read the logits at the
 * last position, (3) softmax → argmax → append. The vocabulary and logits are
 * hand-written for illustration; a real model scores all 50,257 tokens.
 */

type Mode = 'trained' | 'untrained';

interface Iteration {
  candidates: string[];
  logits: number[];
}

const PROMPT = ['The', ' robot', ' opened', ' the'];
const CONTEXT_SIZE = 4;

// The first candidate isn't always the winner: argmax is computed, not assumed.
const RUNS: Record<Mode, Iteration[]> = {
  trained: [
    { candidates: [' window', ' door', ' box', ' lid', ' fridge', ' banana'], logits: [3.1, 4.6, 2.9, 1.8, 2.2, -1.5] },
    { candidates: [' and', ' slowly', '.', ' with', ' to', ' cat'], logits: [4.2, 2.1, 3.8, 2.6, 1.9, -0.7] },
    { candidates: [' stepped', ' walked', ' looked', ' the', ' was', ' purple'], logits: [3.3, 3.9, 3.5, 1.2, 2.4, -1.1] },
    { candidates: [' into', ' away', ' outside', ' out', ' home', ' seven'], logits: [3.6, 2.8, 3.2, 3.9, 2.5, -2.0] },
  ],
  untrained: [
    { candidates: [' Bris', ' door', ' ixel', ' cursed', ' 1998', ' tax'], logits: [0.31, 0.12, 0.27, 0.22, 0.05, 0.18] },
    { candidates: [' and', ' Refer', 'ipient', ' Lak', ' ;', ' cursed'], logits: [0.08, 0.36, 0.11, 0.19, 0.02, 0.29] },
    { candidates: [' moder', ' walked', ' Sov', ' antib', ' Tre', ' ?'], logits: [0.21, 0.06, 0.28, 0.33, 0.14, 0.1] },
    { candidates: [' dup', ' Cha', ' out', ' Wins', ' minced', 'ogl'], logits: [0.17, 0.26, 0.09, 0.23, 0.31, 0.12] },
  ],
};

const PHASES = ['Crop context & run model', 'Logits at the last position', 'Softmax → argmax → append'];

function argmax(v: number[]) {
  return v.reduce((best, x, i) => (x > v[best] ? i : best), 0);
}

export function GenerationStepper() {
  const [mode, setMode] = useState<Mode>('trained');
  const run = RUNS[mode];
  const stepper = useStepper(run.length * PHASES.length, 1500);
  const iter = Math.floor(stepper.step / PHASES.length);
  const phase = stepper.step % PHASES.length;
  const { candidates, logits } = run[iter];
  const probs = softmax(logits);
  const pick = argmax(logits);

  // Tokens generated before this iteration, plus this one once it is appended.
  const generated = run.slice(0, iter).map((it) => it.candidates[argmax(it.logits)]);
  const sequence = [...PROMPT, ...generated];
  const cropStart = Math.max(0, sequence.length - CONTEXT_SIZE);
  const shown = phase === 2 ? [...sequence, candidates[pick]] : sequence;
  const dim = [...Array(cropStart).keys()];

  const minLogit = Math.min(...logits);
  const maxLogit = Math.max(...logits);

  return (
    <Figure
      title="The generation loop, step by step"
      caption="Illustrative vocabulary and scores. Dimmed tokens have fallen outside the model’s 4-token context window (real GPT-2 keeps 1,024). Switch to “Untrained” to see why a model with random weights produces gibberish: its scores are nearly flat."
    >
      <Segmented
        options={[
          { value: 'trained', label: 'Trained (illustrative)' },
          { value: 'untrained', label: 'Untrained' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          stepper.reset();
        }}
      />

      <div className={styles.genPhase}>
        <span className={styles.genIter}>New token {iter + 1}</span>
        <span>{PHASES[phase]}</span>
      </div>

      <TokenChips tokens={shown} dim={dim} highlight={phase === 2 ? [shown.length - 1] : []} />

      <div className={styles.genBody}>
        {phase === 0 && (
          <p className={styles.note}>
            Keep only the last {CONTEXT_SIZE} tokens
            {cropStart > 0 ? ` (dropping ${cropStart})` : ''} and feed them through the model. It returns one row of
            logits per input position: shape <code>[1, {Math.min(sequence.length, CONTEXT_SIZE)}, vocab]</code>.
          </p>
        )}
        {phase === 1 && (
          <>
            <p className={styles.note}>
              Only the last row matters: it scores every candidate for the next token. (Showing 6 of the vocabulary.)
            </p>
            <ProbabilityBars
              labels={candidates}
              values={logits.map((l) => l - Math.min(0, minLogit))}
              max={maxLogit - Math.min(0, minLogit) || 1}
              format={(v) => fmt(v + Math.min(0, minLogit), 2)}
            />
          </>
        )}
        {phase === 2 && (
          <>
            <ProbabilityBars labels={candidates} values={probs} highlight={pick} />
            <p className={styles.note}>
              Highest probability wins: append <b>“{candidates[pick].trim()}”</b> and loop again.
              {mode === 'untrained' && ' With near-equal scores, the choice is essentially arbitrary.'}
            </p>
          </>
        )}
      </div>

      <StepControls stepper={stepper} label={`${stepper.step + 1} / ${stepper.total}`} />
    </Figure>
  );
}

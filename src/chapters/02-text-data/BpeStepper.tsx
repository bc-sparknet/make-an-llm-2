import { useMemo, useState } from 'react';
import { Figure, StepControls, useStepper } from '../../components';
import { END_OF_WORD, trainBpe } from '../../lib/tokenizer';
import styles from './widgets.module.css';

/**
 * Visualises byte-pair encoding: start from characters and repeatedly merge
 * the most frequent adjacent pair. Step 0 shows the initial characters.
 */

const PRESETS = {
  'low / lower / newest': 'low low low low lower lower newest newest newest newest newest newest widest widest',
  'cat / hat / that': 'cat cat hat hat hat that that that the the the then',
};

export function BpeStepper() {
  const [corpus, setCorpus] = useState<string>(Object.values(PRESETS)[0]);
  const { initial, steps } = useMemo(() => trainBpe(corpus, 10), [corpus]);
  const stepper = useStepper(steps.length + 1, 1400);
  const s = stepper.step;

  const words = s === 0 ? initial : steps[s - 1].words;
  const lastMerge = s === 0 ? undefined : steps[s - 1].pair.join('');

  // Collapse repeated words so the display stays compact on phones.
  const counts = new Map<string, { symbols: string[]; n: number }>();
  for (const w of words) {
    const key = w.join('\u0001');
    const entry = counts.get(key);
    if (entry) entry.n++;
    else counts.set(key, { symbols: w, n: 1 });
  }

  return (
    <Figure
      title="Byte-pair encoding, step by step"
      caption={`"${END_OF_WORD}" marks the end of a word. Each step merges the most frequent adjacent pair into a new vocabulary entry, so common words end up as single tokens while rare words stay split into reusable pieces.`}
    >
      <div className={styles.presets}>
        {Object.entries(PRESETS).map(([name, text]) => (
          <button
            key={name}
            className={styles.preset}
            aria-pressed={corpus === text}
            onClick={() => {
              setCorpus(text);
              stepper.reset();
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className={styles.mergeBanner} key={s}>
        {s === 0 ? (
          'Start: every word is split into single characters.'
        ) : (
          <>
            Merge <strong>{steps[s - 1].pair[0]}</strong> + <strong>{steps[s - 1].pair[1]}</strong> →{' '}
            <code>{lastMerge}</code> <span className={styles.muted}>(seen {steps[s - 1].count}×)</span>
          </>
        )}
      </div>

      <ul className={styles.bpeWords}>
        {[...counts.values()].map(({ symbols, n }) => (
          <li key={symbols.join('')}>
            <span className={styles.bpeSymbols}>
              {symbols.map((sym, i) => (
                <span key={i} className={styles.bpeSymbol} data-new={sym === lastMerge}>
                  {sym}
                </span>
              ))}
            </span>
            <span className={styles.muted}>×{n}</span>
          </li>
        ))}
      </ul>

      <StepControls stepper={stepper} label={s === 0 ? 'Characters' : `Merge ${s} of ${steps.length}`} />
    </Figure>
  );
}

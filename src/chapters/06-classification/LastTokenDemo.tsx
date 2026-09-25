import { useState } from 'react';
import { Figure, TokenChips } from '../../components';
import styles from './LastTokenDemo.module.css';

/**
 * Causal attention as a triangle: row i shows which tokens position i may
 * attend to. Tapping a token selects its row. Only the final token's row is
 * complete, which is why its output vector is fed to the classifier.
 */

// "You won a free prize! Reply now" with its real GPT-2 token IDs.
const TOKENS = ['You', ' won', ' a', ' free', ' prize', '!', ' Reply', ' now'];
const IDS = [1639, 1839, 257, 1479, 11596, 0, 14883, 783];

const show = (t: string) => t.trim() || t;

export function LastTokenDemo() {
  const last = TOKENS.length - 1;
  const [sel, setSel] = useState(last);
  const visible = sel + 1;

  return (
    <Figure
      title="Which token has read the whole message?"
      caption="Each row is one position. Filled cells are tokens it can attend to; hatched cells are hidden by the causal mask. Tap a token or a row."
    >
      <TokenChips
        tokens={TOKENS}
        ids={IDS}
        selected={sel}
        dim={TOKENS.map((_, i) => i).filter((i) => i > sel)}
        onTokenClick={setSel}
      />

      <div className="scroll-x">
        <table className={styles.grid}>
          <thead>
            <tr>
              <th />
              {TOKENS.map((t, j) => (
                <th key={j} scope="col" className={styles.col}>
                  <span>{show(t)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOKENS.map((t, i) => (
              <tr key={i} data-selected={i === sel} onClick={() => setSel(i)}>
                <th scope="row" className={styles.row}>
                  {show(t)}
                </th>
                {TOKENS.map((_, j) => (
                  <td
                    key={j}
                    className={styles.cell}
                    data-state={j > i ? 'masked' : i === sel ? 'active' : 'seen'}
                    data-last={i === last && j <= i}
                    aria-label={j > i ? 'hidden' : 'visible'}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.readout} data-complete={sel === last}>
        <strong>“{show(TOKENS[sel])}”</strong> can see {visible} of {TOKENS.length} tokens
        {sel === last
          ? '. It is the only position that has attended to the entire message, so its output summarises everything.'
          : `. It knows nothing about “${TOKENS.slice(sel + 1).map(show).join(' ')}”.`}
      </p>
    </Figure>
  );
}

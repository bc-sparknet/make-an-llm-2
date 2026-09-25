import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import styles from './PaddingDemo.module.css';

/**
 * Three SMS messages as GPT-2 token IDs. Toggling to "padded" appends the
 * <|endoftext|> ID (50256) until every row is as long as the longest one, so
 * the rows stack into a rectangular tensor.
 */

const PAD = 50256;

// Real GPT-2 BPE token IDs for each message.
const MESSAGES = [
  { text: 'Sorry, running late', label: 'ham', ids: [14385, 11, 2491, 2739], toks: ['Sorry', ',', ' running', ' late'] },
  {
    text: 'Call me when you get home',
    label: 'ham',
    ids: [14134, 502, 618, 345, 651, 1363],
    toks: ['Call', ' me', ' when', ' you', ' get', ' home'],
  },
  {
    text: 'WINNER! Claim your free prize now',
    label: 'spam',
    ids: [37620, 21479, 0, 22070, 534, 1479, 11596, 783],
    toks: ['WIN', 'NER', '!', ' Claim', ' your', ' free', ' prize', ' now'],
  },
];

const MAX = Math.max(...MESSAGES.map((m) => m.ids.length));

type View = 'raw' | 'padded';
const VIEWS = [
  { value: 'raw', label: 'Raw token IDs' },
  { value: 'padded', label: 'Padded to longest' },
] as const;

export function PaddingDemo() {
  const [view, setView] = useState<View>('raw');
  const padded = view === 'padded';

  return (
    <Figure
      title="Padding messages to the same length"
      caption={
        <>
          Rows of different lengths can't be stacked into one tensor. Appending token <code>50256</code> (
          <code>&lt;|endoftext|&gt;</code>) makes every row {MAX} tokens long. In the real dataset the longest training
          message sets the length.
        </>
      }
    >
      <Segmented options={VIEWS} value={view} onChange={setView} />

      <div className={`scroll-x ${styles.wrap}`}>
        <div className={styles.rows}>
          {MESSAGES.map((m) => {
            const cells = padded ? [...m.ids, ...Array(MAX - m.ids.length).fill(PAD)] : m.ids;
            return (
              <div key={m.text} className={styles.row}>
                <div className={styles.meta}>
                  <span className={styles.text}>“{m.text}”</span>
                  <span className={styles.tag} data-label={m.label}>
                    {m.label} · {m.ids.length} tokens
                  </span>
                </div>
                <div className={styles.cells}>
                  {cells.map((id, j) => {
                    const pad = j >= m.ids.length;
                    return (
                      <span key={j} className={styles.cell} data-pad={pad} title={pad ? '<|endoftext|>' : m.toks[j]}>
                        <span className={styles.id}>{id}</span>
                        <span className={styles.tok}>{pad ? 'eot' : m.toks[j].replace(/ /g, '·')}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className={styles.shape}>
        {padded ? (
          <>
            Stacks into a tensor of shape <code>[3, {MAX}]</code>
          </>
        ) : (
          <>Lengths {MESSAGES.map((m) => m.ids.length).join(', ')}: not a rectangle yet</>
        )}
      </p>
    </Figure>
  );
}

import { useState } from 'react';
import { Figure } from '../../components';
import { Dim, ShapeText } from './TensorBits';
import { randomTensor } from './tensorUtils';
import styles from './widgets.module.css';

/**
 * A [2, 3, 4] tensor of toy embeddings with the words shown, so each index
 * has a meaning. Tapping a cell reads its full index out in plain English.
 */

const SENTENCES = [
  ['the', 'cat', 'sat'],
  ['a', 'dog', 'ran'],
];
const X = randomTensor([2, 3, 4], 42) as number[][][];

export function ShapeReader() {
  const [[b, t, d], setSel] = useState<[number, number, number]>([0, 2, 3]);
  const v = X[b][t][d];
  const word = SENTENCES[b][t];

  return (
    <Figure
      title="Read a 3-D shape"
      caption="Outermost first: the first index picks a sentence (a whole matrix), the second picks a token (a row), the third picks one feature (a single number). Tap any cell."
    >
      <div className={styles.readerHeader}>
        <code className={styles.viewName}>x</code>
        <span className={styles.viewShape}>
          shape <ShapeText shape={[2, 3, 4]} />
        </span>
      </div>
      <div className={styles.dimList}>
        <Dim d={0}>dim 0: batch (2 sentences)</Dim>
        <Dim d={1}>dim 1: tokens (3 per sentence)</Dim>
        <Dim d={2}>dim 2: emb_dim (4 features)</Dim>
      </div>

      <div className={styles.readerBlocks}>
        {X.map((m, bi) => (
          <div key={bi} className={styles.readerBlock} data-active={bi === b}>
            <div className={styles.readerBlockTitle}>
              <code>
                x[<Dim d={0}>{bi}</Dim>]
              </code>{' '}
              <span className={styles.muted}>sentence {bi}: “{SENTENCES[bi].join(' ')}”</span>
            </div>
            <div className={styles.readerGrid}>
              <span />
              {m[0].map((_, di) => (
                <span key={di} className={styles.colHead}>
                  <Dim d={2}>{di}</Dim>
                </span>
              ))}
              {m.map((row, ti) => (
                <div key={ti} className={styles.readerRow}>
                  <span className={styles.rowHead}>
                    <Dim d={1}>
                      {ti} {SENTENCES[bi][ti]}
                    </Dim>
                  </span>
                  {row.map((val, di) => {
                    const state =
                      bi === b && ti === t && di === d ? 'highlight' : bi === b && ti === t ? 'row' : undefined;
                    return (
                      <button
                        key={di}
                        className={styles.readerCell}
                        data-state={state}
                        onClick={() => setSel([bi, ti, di])}
                        aria-label={`x[${bi}, ${ti}, ${di}] = ${val}`}
                        aria-pressed={state === 'highlight'}
                      >
                        {val.toFixed(1)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.readout} aria-live="polite">
        <code className={styles.readoutIndex}>
          x[<Dim d={0}>{b}</Dim>, <Dim d={1}>{t}</Dim>, <Dim d={2}>{d}</Dim>] = {v.toFixed(1)}
        </code>
        <p>
          <Dim d={0}>sentence {b}</Dim>, <Dim d={1}>token {t} (“{word}”)</Dim>, <Dim d={2}>feature {d}</Dim>.
        </p>
        <ul className={styles.zoom}>
          <li>
            <code>
              x[<Dim d={0}>{b}</Dim>]
            </code>{' '}
            → a matrix, shape <ShapeText shape={[3, 4]} />: the whole sentence
          </li>
          <li>
            <code>
              x[<Dim d={0}>{b}</Dim>, <Dim d={1}>{t}</Dim>]
            </code>{' '}
            → a vector, shape <ShapeText shape={[4]} />: the embedding of “{word}”
          </li>
          <li>
            <code>
              x[<Dim d={0}>{b}</Dim>, <Dim d={1}>{t}</Dim>, <Dim d={2}>{d}</Dim>]
            </code>{' '}
            → a single number, shape <ShapeText shape={[]} />
          </li>
        </ul>
      </div>
    </Figure>
  );
}

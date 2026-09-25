import { useState } from 'react';
import { Figure, HeatGrid, TokenChips } from '../../components';
import { randomMatrix } from '../../lib/math';
import styles from './widgets.module.css';

/**
 * Token embedding lookup + positional embeddings. Tap a token in the sentence
 * to see which row of each matrix it selects and how they are added.
 */

const VOCAB = ['a', 'cat', 'dog', 'sat', 'the', 'on', 'mat'];
const SENTENCE = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
const DIM = 4;

const tokenEmbeddings = randomMatrix(VOCAB.length, DIM, 7);
const positionEmbeddings = randomMatrix(SENTENCE.length, DIM, 42, 0.6);

export function EmbeddingLookup() {
  const [pos, setPos] = useState(1);
  const token = SENTENCE[pos];
  const id = VOCAB.indexOf(token);
  const combined = tokenEmbeddings[id].map((v, k) => v + positionEmbeddings[pos][k]);

  return (
    <Figure
      title="From token ID to input vector"
      caption='Both "the" tokens select the same row of the token-embedding matrix, but different rows of the position-embedding matrix, so the model receives different vectors for them.'
    >
      <p className={styles.hint}>Tap a token:</p>
      <TokenChips
        tokens={SENTENCE}
        ids={SENTENCE.map((t) => VOCAB.indexOf(t))}
        selected={pos}
        onTokenClick={setPos}
      />

      <div className={styles.embedGrid}>
        <div>
          <div className={styles.matrixTitle}>
            Token embeddings <span className={styles.muted}>(vocab × {DIM})</span>
          </div>
          <HeatGrid data={tokenEmbeddings} rowLabels={VOCAB.map((v, i) => `${i} ${v}`)} highlightRow={id} digits={1} min={-1} max={1} />
        </div>
        <div>
          <div className={styles.matrixTitle}>
            Position embeddings <span className={styles.muted}>(context × {DIM})</span>
          </div>
          <HeatGrid
            data={positionEmbeddings}
            rowLabels={SENTENCE.map((_, i) => `pos ${i}`)}
            highlightRow={pos}
            digits={1}
            min={-1}
            max={1}
          />
        </div>
      </div>

      <div className={styles.sum}>
        <HeatGrid data={[tokenEmbeddings[id]]} rowLabels={[`“${token}”`]} digits={2} min={-1.6} max={1.6} />
        <span className={styles.op}>+</span>
        <HeatGrid data={[positionEmbeddings[pos]]} rowLabels={[`pos ${pos}`]} digits={2} min={-1.6} max={1.6} />
        <span className={styles.op}>=</span>
        <HeatGrid data={[combined]} rowLabels={['input']} digits={2} min={-1.6} max={1.6} />
      </div>
    </Figure>
  );
}

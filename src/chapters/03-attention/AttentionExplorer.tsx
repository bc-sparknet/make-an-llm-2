import { useState } from 'react';
import { Figure, ProbabilityBars, TokenChips } from '../../components';
import { dot, fmt, softmax } from '../../lib/math';
import { EMBEDDINGS, TOKENS } from './attention';
import styles from './AttentionExplorer.module.css';

/**
 * Simplified self-attention with no trainable weights. The learner taps a
 * token to make it the query and sees its dot-product scores, the softmax
 * weights, and the context vector built as a weighted sum of all embeddings.
 */
export function AttentionExplorer() {
  const [query, setQuery] = useState(2);
  const q = EMBEDDINGS[query];
  const scores = EMBEDDINGS.map((x) => dot(q, x));
  const weights = softmax(scores);
  const context = [0, 1, 2].map((d) => weights.reduce((s, w, i) => s + w * EMBEDDINGS[i][d], 0));
  const top = weights.indexOf(Math.max(...weights));
  const vec = (v: number[]) => `[${v.map((x) => fmt(x)).join(', ')}]`;

  return (
    <Figure
      title="Attention without weights"
      caption="Tap any word to make it the query. Similar embeddings give bigger dot products, so they get a bigger share of the weight, but every token contributes something."
    >
      <TokenChips tokens={TOKENS} onTokenClick={setQuery} selected={query} />

      <p className={styles.query}>
        Query <strong>“{TOKENS[query]}”</strong> = <code>{vec(q)}</code>
      </p>

      <h4 className={styles.step}>
        <span className={styles.num}>1</span> Scores: dot product with every token
      </h4>
      <ProbabilityBars
        labels={TOKENS}
        values={scores}
        max={Math.max(...scores)}
        highlight={query}
        format={(v) => v.toFixed(2)}
      />

      <h4 className={styles.step}>
        <span className={styles.num}>2</span> Weights: softmax of the scores
      </h4>
      <ProbabilityBars labels={TOKENS} values={weights} highlight={top} max={Math.max(...weights) * 1.05} />
      <p className={styles.note}>
        Sum = {weights.reduce((a, b) => a + b, 0).toFixed(2)}. Largest weight: “{TOKENS[top]}”.
      </p>

      <h4 className={styles.step}>
        <span className={styles.num}>3</span> Context vector: weighted sum
      </h4>
      <div className="scroll-x">
        <table className={styles.sumTable}>
          <thead>
            <tr>
              <th>token</th>
              <th>weight</th>
              <th>weight × embedding</th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.map((t, i) => (
              <tr key={t} data-query={i === query}>
                <td>{t}</td>
                <td>{weights[i].toFixed(2)}</td>
                <td className={styles.mono}>{vec(EMBEDDINGS[i].map((x) => x * weights[i]))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>context z</td>
              <td className={styles.mono}>{vec(context)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Figure>
  );
}

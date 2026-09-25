import type { Matrix } from '../../lib/math';
import { causalMask, matmul, randomMatrix, scale, seededRandom, softmaxRows, transpose } from '../../lib/math';

/**
 * Shared toy data and helpers for the Chapter 3 visuals. Everything is small
 * and deterministic so each figure shows the same numbers on every render.
 */

/** The running example sentence, one token per word. */
export const TOKENS = ['My', 'cat', 'naps', 'in', 'warm', 'sun'];

/**
 * Hand-picked 3-D embeddings. Related words point in similar directions:
 * "cat"/"naps" lean on dimension 0, "warm"/"sun" on dimension 2, and the
 * small function words "My"/"in" on dimension 1.
 */
export const EMBEDDINGS: Matrix = [
  [0.2, 0.7, 0.1], // My
  [0.9, 0.3, 0.2], // cat
  [0.7, 0.2, 0.5], // naps
  [0.1, 0.6, 0.3], // in
  [0.3, 0.1, 0.9], // warm
  [0.4, 0.2, 0.8], // sun
];

export interface AttentionSteps {
  Q: Matrix;
  K: Matrix;
  V: Matrix;
  scores: Matrix;
  scaled: Matrix;
  masked: Matrix;
  weights: Matrix;
  context: Matrix;
}

/** Runs single-head scaled dot-product attention and keeps every intermediate. */
export function attention(X: Matrix, Wq: Matrix, Wk: Matrix, Wv: Matrix, causal = false): AttentionSteps {
  const Q = matmul(X, Wq);
  const K = matmul(X, Wk);
  const V = matmul(X, Wv);
  const scores = matmul(Q, transpose(K));
  const scaled = scale(scores, 1 / Math.sqrt(K[0].length));
  const masked = causal ? causalMask(scaled) : scaled;
  const weights = softmaxRows(masked);
  const context = matmul(weights, V);
  return { Q, K, V, scores, scaled, masked, weights, context };
}

/** Seeded projection matrices (d_in × d_out) for one attention head. */
export function headWeights(dIn: number, dOut: number, seed: number, range = 1) {
  return {
    Wq: randomMatrix(dIn, dOut, seed, range),
    Wk: randomMatrix(dIn, dOut, seed + 101, range),
    Wv: randomMatrix(dIn, dOut, seed + 202, range),
  };
}

/**
 * Inverted dropout: each entry is zeroed with probability p and survivors are
 * multiplied by 1 / (1 - p). Returns the new matrix and which cells dropped.
 */
export function dropout(m: Matrix, p: number, seed: number): { out: Matrix; dropped: boolean[][] } {
  const rand = seededRandom(seed);
  const dropped = m.map((row) => row.map(() => rand() < p));
  const keep = p < 1 ? 1 / (1 - p) : 0;
  const out = m.map((row, i) => row.map((v, j) => (dropped[i][j] ? 0 : v * keep)));
  return { out, dropped };
}

/**
 * Tiny, dependency-free linear-algebra helpers used by the visualizations.
 *
 * These mirror the PyTorch operations shown in the code examples, but work on
 * plain arrays so every intermediate value can be displayed. They favour
 * clarity over speed — the matrices on this site are never bigger than ~16×16.
 */

export type Vector = number[];
export type Matrix = number[][];

export function dot(a: Vector, b: Vector): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

export function transpose(m: Matrix): Matrix {
  return m[0].map((_, col) => m.map((row) => row[col]));
}

/** (n×k) @ (k×m) → (n×m) */
export function matmul(a: Matrix, b: Matrix): Matrix {
  const bT = transpose(b);
  return a.map((row) => bT.map((col) => dot(row, col)));
}

export function scale(m: Matrix, factor: number): Matrix {
  return m.map((row) => row.map((v) => v * factor));
}

export function sum(v: Vector): number {
  return v.reduce((s, x) => s + x, 0);
}

export function mean(v: Vector): number {
  return sum(v) / v.length;
}

export function variance(v: Vector): number {
  const mu = mean(v);
  return mean(v.map((x) => (x - mu) ** 2));
}

/** Numerically-stable softmax (subtracts the max before exponentiating). */
export function softmax(v: Vector, temperature = 1): Vector {
  const scaled = v.map((x) => x / temperature);
  const max = Math.max(...scaled.filter(Number.isFinite));
  const exps = scaled.map((x) => (Number.isFinite(x) ? Math.exp(x - max) : 0));
  const total = sum(exps);
  return exps.map((e) => e / total);
}

export function softmaxRows(m: Matrix): Matrix {
  return m.map((row) => softmax(row));
}

/** Layer normalisation without the learnable scale/shift. */
export function layerNorm(v: Vector, eps = 1e-5): Vector {
  const mu = mean(v);
  const sd = Math.sqrt(variance(v) + eps);
  return v.map((x) => (x - mu) / sd);
}

export function relu(x: number): number {
  return Math.max(0, x);
}

/** The tanh approximation of GELU used by GPT-2. */
export function gelu(x: number): number {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
}

/** Replaces entries above the diagonal with -Infinity (a causal mask). */
export function causalMask(m: Matrix): Matrix {
  return m.map((row, i) => row.map((v, j) => (j > i ? -Infinity : v)));
}

/** Deterministic pseudo-random numbers so "random" weights are stable across renders. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function randomMatrix(rows: number, cols: number, seed: number, range = 1): Matrix {
  const rand = seededRandom(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rand() * 2 - 1) * range),
  );
}

export function round(x: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

/** Formats a number for display in a matrix cell, handling -Infinity. */
export function fmt(x: number, digits = 2): string {
  if (x === -Infinity) return '−∞';
  if (x === Infinity) return '∞';
  return round(x, digits).toFixed(digits);
}

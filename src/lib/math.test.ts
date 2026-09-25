import { describe, expect, it } from 'vitest';
import { causalMask, gelu, layerNorm, matmul, mean, softmax, variance } from './math';

describe('softmax', () => {
  it('sums to 1 and preserves order', () => {
    const p = softmax([1, 2, 3]);
    expect(p.reduce((a, b) => a + b)).toBeCloseTo(1);
    expect(p[2]).toBeGreaterThan(p[1]);
  });

  it('gives zero probability to -Infinity entries', () => {
    expect(softmax([0, -Infinity])).toEqual([1, 0]);
  });

  it('flattens with high temperature and sharpens with low temperature', () => {
    const hot = softmax([1, 2], 10);
    const cold = softmax([1, 2], 0.1);
    expect(hot[1] - hot[0]).toBeLessThan(cold[1] - cold[0]);
  });
});

describe('matmul', () => {
  it('multiplies (2×3)·(3×2)', () => {
    expect(matmul([[1, 2, 3], [4, 5, 6]], [[1, 0], [0, 1], [1, 1]])).toEqual([[4, 5], [10, 11]]);
  });
});

describe('layerNorm', () => {
  it('produces mean 0 and variance ~1', () => {
    const out = layerNorm([2, 4, 6, 8]);
    expect(mean(out)).toBeCloseTo(0);
    expect(variance(out)).toBeCloseTo(1, 3);
  });
});

describe('causalMask', () => {
  it('masks entries above the diagonal', () => {
    expect(causalMask([[1, 2], [3, 4]])).toEqual([[1, -Infinity], [3, 4]]);
  });
});

describe('gelu', () => {
  it('matches known values', () => {
    expect(gelu(0)).toBe(0);
    expect(gelu(1)).toBeCloseTo(0.8412, 3);
    expect(gelu(-3)).toBeCloseTo(-0.0036, 3);
  });
});

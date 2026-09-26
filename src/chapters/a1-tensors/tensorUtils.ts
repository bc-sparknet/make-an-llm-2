import { seededRandom } from '../../lib/math';

/** Any nested array of numbers (or a bare number for a 0-D tensor). */
export type Nested = number | Nested[];

/** Builds a nested array of the given shape from a flat, row-major list. */
export function build(shape: number[], flat: number[], offset = 0): Nested {
  if (shape.length === 0) return flat[offset];
  const [n, ...rest] = shape;
  const size = rest.reduce((a, b) => a * b, 1);
  return Array.from({ length: n }, (_, i) => build(rest, flat, offset + i * size));
}

/** Nested array holding 0, 1, 2, … like torch.arange(n).reshape(shape). */
export const arange = (shape: number[]): Nested =>
  build(shape, Array.from({ length: shape.reduce((a, b) => a * b, 1) }, (_, i) => i));

/** Deterministic "random" values in [-1, 1), rounded to one decimal. */
export function randomTensor(shape: number[], seed: number): Nested {
  const rand = seededRandom(seed);
  const n = shape.reduce((a, b) => a * b, 1);
  return build(
    shape,
    Array.from({ length: n }, () => Math.round((rand() * 2 - 1) * 10) / 10),
  );
}

/** Formats a shape the way PyTorch prints it: torch.Size([2, 3]). */
export const sizeStr = (shape: number[]) => `torch.Size([${shape.join(', ')}])`;

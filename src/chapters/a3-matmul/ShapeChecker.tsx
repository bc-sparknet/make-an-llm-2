import { useState } from 'react';
import { Figure } from '../../components';
import styles from './widgets.module.css';

/**
 * Shape-checks A @ B for a set of preset shapes. Shapes are right-aligned (the
 * way PyTorch lines them up), with each dimension coloured by its role: batch,
 * rows of A, the inner dimension that must match, and columns of B.
 */

interface Preset {
  id: string;
  label: string;
  a: number[];
  b: number[];
  note: string;
}

const PRESETS: Preset[] = [
  { id: '2d', label: '2-D', a: [3, 2], b: [2, 3], note: 'The matrices from the stepper above.' },
  { id: 'qkt', label: 'Q @ K.T', a: [5, 8], b: [8, 5], note: '5 tokens, 8-dim queries against 8-dim keys (transposed).' },
  { id: 'qk', label: 'Q @ K (oops)', a: [5, 8], b: [5, 8], note: 'Forgot to transpose the keys.' },
  { id: 'bmm', label: 'batched', a: [2, 3, 4], b: [2, 4, 5], note: 'Two independent (3×4) @ (4×5) multiplies.' },
  { id: 'lin', label: 'x @ W.T', a: [2, 5, 4], b: [4, 3], note: 'What nn.Linear(4, 3) does to a [batch, tokens, 4] input.' },
  { id: 'heads', label: 'q @ kᵀ, heads', a: [2, 12, 6, 64], b: [2, 12, 64, 6], note: 'Multi-head scores: batch 2, 12 heads, 6 tokens, head_dim 64.' },
  { id: 'wv', label: 'weights @ v', a: [2, 12, 6, 6], b: [2, 12, 6, 64], note: 'Attention weights mixing the value vectors, per head.' },
  { id: 'clash', label: 'batch clash', a: [2, 3, 4], b: [3, 4, 5], note: 'Inner dims match, but the batch sizes don’t.' },
];

type Kind = 'batch' | 'rows' | 'inner' | 'cols' | 'bad' | 'none';

const SLOTS = 4;

function pad<T>(xs: T[], fill: T): T[] {
  return [...Array(SLOTS - xs.length).fill(fill), ...xs];
}

function analyse(a: number[], b: number[]) {
  const innerOk = a[a.length - 1] === b[b.length - 2];
  const aBatch = a.slice(0, -2);
  const bBatch = b.slice(0, -2);
  const nb = Math.max(aBatch.length, bBatch.length);
  const pa = [...Array(nb - aBatch.length).fill(null), ...aBatch] as (number | null)[];
  const pb = [...Array(nb - bBatch.length).fill(null), ...bBatch] as (number | null)[];
  const batch = pa.map((x, i) => {
    const y = pb[i];
    if (x === null) return { ok: true, size: y as number, how: 'missing in A: broadcast' };
    if (y === null) return { ok: true, size: x, how: 'missing in B: B is reused for every batch' };
    if (x === y) return { ok: true, size: x, how: 'equal' };
    if (x === 1 || y === 1) return { ok: true, size: Math.max(x, y), how: 'one is 1: broadcast' };
    return { ok: false, size: 0, how: `${x} vs ${y}: clash` };
  });
  const batchOk = batch.every((d) => d.ok);
  const result = innerOk && batchOk ? [...batch.map((d) => d.size), a[a.length - 2], b[b.length - 1]] : null;
  return { innerOk, batch, batchOk, result, nb };
}

export function ShapeChecker() {
  const [id, setId] = useState('qkt');
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
  const { a, b } = p;
  const { innerOk, batch, batchOk, result } = analyse(a, b);

  const batchKind = (pos: number, isA: boolean): Kind => {
    // pos counts from the left of the batch part of this tensor
    const own = isA ? a.slice(0, -2) : b.slice(0, -2);
    const offset = batch.length - own.length;
    return batch[pos + offset]?.ok === false ? 'bad' : 'batch';
  };

  const aKinds: Kind[] = pad<Kind>(
    [...a.slice(0, -2).map((_, i) => batchKind(i, true)), 'rows', innerOk ? 'inner' : 'bad'],
    'none',
  );
  const bKinds: Kind[] = pad<Kind>(
    [...b.slice(0, -2).map((_, i) => batchKind(i, false)), innerOk ? 'inner' : 'bad', 'cols'],
    'none',
  );
  const aCells = pad<number | null>(a, null);
  const bCells = pad<number | null>(b, null);
  const rCells = result ? pad<number | null>(result, null) : null;
  const rKinds: Kind[] = result
    ? pad<Kind>([...result.slice(0, -2).map(() => 'batch' as Kind), 'rows', 'cols'], 'none')
    : [];

  const fmt = (s: number[]) => `[${s.join(', ')}]`;
  const k1 = a[a.length - 1];
  const k2 = b[b.length - 2];

  return (
    <Figure
      title="Shape checker"
      caption="Line the shapes up from the right. The last two dims of each are the matrices; everything before them is batch. A's last dim and B's second-to-last (purple, on the diagonal) must match, and they vanish from the result."
    >
      <div className={styles.presets} role="group" aria-label="Choose a pair of shapes">
        {PRESETS.map((x) => (
          <button key={x.id} className={styles.preset} aria-pressed={x.id === id} onClick={() => setId(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      <code className={styles.codeLine}>
        {fmt(a)} @ {fmt(b)}
      </code>
      <p className={styles.hint}>{p.note}</p>

      <div className={styles.scTable}>
        <span className={styles.scLabel}>A</span>
        {aCells.map((v, s) => (
          <span key={`a${s}`} className={styles.chip} data-kind={aKinds[s]}>
            {v ?? ''}
          </span>
        ))}
        <span className={styles.scLabel}>B</span>
        {bCells.map((v, s) => (
          <span key={`b${s}`} className={styles.chip} data-kind={bKinds[s]}>
            {v ?? ''}
          </span>
        ))}
        <span className={styles.divider} />
        <span className={styles.scLabel}>A @ B</span>
        {rCells
          ? rCells.map((v, s) => (
              <span key={`r${s}`} className={styles.chip} data-kind={rKinds[s]}>
                {v ?? ''}
              </span>
            ))
          : Array.from({ length: SLOTS }, (_, s) => (
              <span key={`r${s}`} className={styles.chip} data-kind={s === SLOTS - 1 ? 'bad' : 'none'}>
                {s === SLOTS - 1 ? '✗' : ''}
              </span>
            ))}
      </div>

      <ul className={styles.checks}>
        <li>
          <span className={innerOk ? styles.ok : styles.bad}>{innerOk ? '✓' : '✗'}</span>
          <span>
            <span className={styles.inner}>Inner dims</span>: A’s last is {k1}, B’s second-to-last is {k2}.{' '}
            {innerOk ? 'They match, get summed over, and disappear.' : 'They must be equal: each row of A is dotted with each column of B.'}
          </span>
        </li>
        <li>
          <span className={batchOk ? styles.ok : styles.bad}>{batch.length === 0 ? '·' : batchOk ? '✓' : '✗'}</span>
          <span>
            <span className={styles.batch}>Batch dims</span>:{' '}
            {batch.length === 0
              ? 'none. This is a plain 2-D matrix multiply.'
              : batch.map((d, i) => `${d.how}${i < batch.length - 1 ? '; ' : '.'}`).join('')}
          </span>
        </li>
      </ul>

      <div className={styles.verdict} data-ok={!!result} aria-live="polite">
        {result
          ? `Result: ${fmt(result)}. That is ${result.slice(0, -2).reduce((x, y) => x * y, 1)} matrix multiply${result.length > 2 && result.slice(0, -2).reduce((x, y) => x * y, 1) > 1 ? 's' : ''} of (${a[a.length - 2]}×${k1}) @ (${k2}×${b[b.length - 1]}).`
          : !innerOk
            ? `RuntimeError: shapes cannot be multiplied (inner ${k1} ≠ ${k2}).`
            : 'RuntimeError: the batch dimensions don’t match and can’t be broadcast.'}
      </div>
    </Figure>
  );
}

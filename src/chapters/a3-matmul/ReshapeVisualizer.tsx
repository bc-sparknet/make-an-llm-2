import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Figure, Segmented } from '../../components';
import styles from './widgets.module.css';

/**
 * The numbers 0–11 in memory, viewed through different shapes. Each cell is
 * coloured by its value, so the reading order is visible at a glance: views
 * keep the smooth left-to-right gradient, a transpose scrambles it.
 */

type PresetId = 'flat' | 'v34' | 'v43' | 'v232' | 'v26' | 'T' | 'Tc';

interface Preset {
  label: string;
  code: string;
  shape: number[];
  /** How many memory slots to jump for one step along each dim. */
  strides: number[];
  /** The underlying numbers, in memory order. */
  storage: number[];
  note: string;
}

const RANGE = Array.from({ length: 12 }, (_, i) => i);
const T_ORDER = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11];

const PRESETS: Record<PresetId, Preset> = {
  flat: {
    label: '[12]',
    code: 't = torch.arange(12)',
    shape: [12],
    strides: [1],
    storage: RANGE,
    note: 'One row of 12 numbers. This is also exactly how they sit in memory.',
  },
  v34: {
    label: '[3, 4]',
    code: 't.view(3, 4)',
    shape: [3, 4],
    strides: [4, 1],
    storage: RANGE,
    note: 'Cut the strip into 3 rows of 4. Read left to right, top to bottom and you get 0…11 again.',
  },
  v43: {
    label: '[4, 3]',
    code: 't.view(4, 3)',
    shape: [4, 3],
    strides: [3, 1],
    storage: RANGE,
    note: 'Same 12 numbers, now 4 rows of 3. Not the same as a transpose: 1 is still next to 0.',
  },
  v232: {
    label: '[2, 3, 2]',
    code: 't.view(2, 3, 2)',
    shape: [2, 3, 2],
    strides: [6, 2, 1],
    storage: RANGE,
    note: '2 blocks, each 3 rows of 2. The last dim changes fastest as you read.',
  },
  v26: {
    label: '[2, 6]',
    code: 't.view(2, -1)   # -1 → 6',
    shape: [2, 6],
    strides: [6, 1],
    storage: RANGE,
    note: '-1 means “work it out”: 12 numbers / 2 rows = 6 columns.',
  },
  T: {
    label: '[3, 4].T',
    code: 't.view(3, 4).T',
    shape: [4, 3],
    strides: [1, 4],
    storage: RANGE,
    note: 'Rows become columns. Memory is untouched; PyTorch just walks it in a different order, jumping by 4.',
  },
  Tc: {
    label: '.T.contiguous()',
    code: 't.view(3, 4).T.contiguous()',
    shape: [4, 3],
    strides: [3, 1],
    storage: T_ORDER,
    note: 'contiguous() copies the numbers into fresh memory in the new reading order. Now view() works again.',
  },
};

function indices(shape: number[]): number[][] {
  return shape.reduce<number[][]>((acc, n) => acc.flatMap((p) => Array.from({ length: n }, (_, i) => [...p, i])), [[]]);
}

const colourOf = (v: number): CSSProperties => ({
  background: `color-mix(in oklab, var(--blue) ${Math.round((v / 11) * 100)}%, var(--accent))`,
});

function ValCell({ v }: { v: number }) {
  return (
    <span className={styles.valCell} style={colourOf(v)}>
      {v}
    </span>
  );
}

export function ReshapeVisualizer() {
  const [id, setId] = useState<PresetId>('v34');
  const p = PRESETS[id];
  const at = (idx: number[]) => p.storage[idx.reduce((s, i, d) => s + i * p.strides[d], 0)];
  const reading = indices(p.shape).map(at);
  const contiguous = reading.every((v, i) => v === p.storage[i]);

  const grid = (prefix: number[], rows: number, cols: number) => (
    <div className={styles.mat} style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
      {Array.from({ length: rows * cols }, (_, k) => (
        <ValCell key={k} v={at([...prefix, Math.floor(k / cols), k % cols])} />
      ))}
    </div>
  );

  return (
    <Figure
      title="Same numbers, different shapes"
      caption="view and reshape only change how the strip is cut into rows, so the reading order stays 0 to 11. transpose changes the order you walk the numbers, without moving them, so the result is no longer contiguous."
    >
      <Segmented
        label="Shape"
        value={id}
        onChange={setId}
        options={(Object.keys(PRESETS) as PresetId[]).map((k) => ({ value: k, label: PRESETS[k].label }))}
      />
      <div style={{ height: 'var(--space-3)' }} />

      <code className={styles.codeLine}>{p.code}</code>
      <p className={styles.shapeLine}>
        shape [{p.shape.join(', ')}] <span className={styles.muted}>· stride ({p.strides.join(', ')})</span>
      </p>

      <div className={styles.stage}>
        {p.shape.length === 1 && (
          <div className={styles.mat} style={{ gridTemplateColumns: 'repeat(6, auto)' }}>
            {RANGE.map((k) => (
              <ValCell key={k} v={at([k])} />
            ))}
          </div>
        )}
        {p.shape.length === 2 && grid([], p.shape[0], p.shape[1])}
        {p.shape.length === 3 &&
          Array.from({ length: p.shape[0] }, (_, b) => (
            <div key={b} className={styles.slice}>
              <span className={styles.sliceLabel}>x[{b}]</span>
              {grid([b], p.shape[1], p.shape[2])}
            </div>
          ))}
      </div>
      {p.shape.length === 1 && <p className={styles.hint}>(Wrapped onto two lines to fit the screen: it’s still one row.)</p>}

      <div className={styles.stripLabel}>In memory (never moved by view or transpose)</div>
      <div className={styles.strip}>
        {p.storage.map((v, k) => (
          <span key={k} className={styles.stripCell} style={colourOf(v)}>
            {v}
          </span>
        ))}
      </div>
      <div className={styles.stripLabel}>Reading order of this tensor (last dim fastest)</div>
      <div className={styles.strip}>
        {reading.map((v, k) => (
          <span key={k} className={styles.stripCell} style={colourOf(v)}>
            {v}
          </span>
        ))}
      </div>

      <p className={styles.hint}>{p.note}</p>

      <div className={styles.flag} data-kind={contiguous ? 'ok' : 'warn'} aria-live="polite">
        {contiguous ? (
          <>
            <strong>Contiguous.</strong> Reading order matches memory order, so another <code>.view()</code> is free.
          </>
        ) : (
          <>
            <strong>Not contiguous.</strong> Reading order ≠ memory order, so <code>.view(12)</code> raises an error. Call{' '}
            <code>.contiguous()</code> first (or use <code>.reshape()</code>, which copies when it has to).
          </>
        )}
      </div>
    </Figure>
  );
}

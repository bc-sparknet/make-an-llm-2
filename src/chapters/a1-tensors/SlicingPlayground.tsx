import { useState } from 'react';
import { Figure, TensorView, type TensorData } from '../../components';
import { Dim, ScalarBox, ShapeText } from './TensorBits';
import { arange } from './tensorUtils';
import styles from './widgets.module.css';

/**
 * Pick an index expression for x = torch.arange(24).reshape(2, 3, 4); the
 * selected elements light up and the result is drawn with its shape, plus a
 * per-dimension note on whether that dimension was removed or kept.
 */

const SHAPE = [2, 3, 4];
const DIM_NAMES = ['batch', 'tokens', 'emb_dim'];
const X = arange(SHAPE) as number[][][];

/** An integer index removes its dimension; a slice [start, end) keeps it. */
type Part = { int: number; text?: string } | { start: number; end: number; text: string };

const ALL = (d: number): Part => ({ start: 0, end: SHAPE[d], text: ':' });

const PRESETS: { expr: string; parts: Part[]; note: string }[] = [
  { expr: 'x[0]', parts: [{ int: 0 }, ALL(1), ALL(2)], note: 'The first sentence. Missing trailing indices mean “all”.' },
  { expr: 'x[1, 2]', parts: [{ int: 1 }, { int: 2 }, ALL(2)], note: 'Sentence 1, token 2: one embedding vector.' },
  { expr: 'x[:, -1, :]', parts: [ALL(0), { int: 2, text: '-1' }, ALL(2)], note: 'The last token of every sentence. −1 counts from the end.' },
  { expr: 'x[:, :, 0]', parts: [ALL(0), ALL(1), { int: 0 }], note: 'Feature 0 of every token in every sentence.' },
  { expr: 'x[0, 1:3]', parts: [{ int: 0 }, { start: 1, end: 3, text: '1:3' }, ALL(2)], note: 'Sentence 0, tokens 1 and 2 (the end of a range is excluded).' },
  { expr: 'x[..., -1]', parts: [ALL(0), ALL(1), { int: 3, text: '-1' }], note: '“...” means “: for every dimension I didn’t mention”, so this is x[:, :, -1].' },
  { expr: 'x[1, 2, 3]', parts: [{ int: 1 }, { int: 2 }, { int: 3 }], note: 'One index per dimension: a single number, a 0-D tensor.' },
];

const picked = (p: Part, i: number) => ('int' in p ? i === p.int : i >= p.start && i < p.end);

function select(parts: Part[]): { data: unknown; shape: number[]; kept: number[] } {
  const [p0, p1, p2] = parts;
  const range = (p: Part, n: number) => Array.from({ length: n }, (_, i) => i).filter((i) => picked(p, i));
  // Build the full [b][t][d] selection, then drop the dimensions that got an integer index.
  const drop = (arr: unknown[], p: Part) => ('int' in p ? arr[0] : arr);
  const data = drop(
    range(p0, 2).map((b) => drop(range(p1, 3).map((t) => drop(range(p2, 4).map((d) => X[b][t][d]), p2)), p1)),
    p0,
  );
  const shape = parts.flatMap((p) => ('int' in p ? [] : [p.end - p.start]));
  const kept = parts.flatMap((p, d) => ('int' in p ? [] : [d]));
  return { data, shape, kept };
}

export function SlicingPlayground() {
  const [idx, setIdx] = useState(2);
  const preset = PRESETS[idx];
  const { data, shape, kept } = select(preset.parts);

  return (
    <Figure
      title="Slicing playground"
      caption="An integer index picks one position and removes that dimension. A slice (:, 1:3, …) keeps the dimension, even if only part of it survives. The result's shape is the original shape with the integer-indexed dimensions crossed out."
    >
      <div className={styles.presets} role="radiogroup" aria-label="Index expression">
        {PRESETS.map((p, i) => (
          <button key={p.expr} role="radio" aria-checked={i === idx} className={styles.preset} onClick={() => setIdx(i)}>
            <code>{p.expr}</code>
          </button>
        ))}
      </div>

      <TensorView
        name="x"
        data={X}
        dimNames={DIM_NAMES}
        cellState={([b, t, d]) =>
          picked(preset.parts[0], b) && picked(preset.parts[1], t) && picked(preset.parts[2], d) ? 'highlight' : 'dim'
        }
      />

      <p className={styles.meaning}>{preset.note}</p>

      <ul className={styles.dimNotes}>
        {preset.parts.map((p, d) => (
          <li key={d} data-removed={'int' in p}>
            <Dim d={d}>
              dim {d} ({DIM_NAMES[d]})
            </Dim>
            <code>{'int' in p ? (p.text ?? p.int) : p.text}</code>
            <span>
              {'int' in p
                ? 'integer → removed'
                : p.end - p.start === SHAPE[d]
                  ? `slice → kept all ${SHAPE[d]}`
                  : `slice → kept ${p.end - p.start} of ${SHAPE[d]}`}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.resultBox}>
        <div className={styles.resultHead}>
          <strong>Result.</strong>{' '}
          {kept.length === 0 ? (
            'No dimensions kept: a 0-D tensor.'
          ) : (
            <>
              Kept{' '}
              {kept.map((d, k) => (
                <span key={d}>
                  {k > 0 && ', '}
                  <Dim d={d}>
                    {DIM_NAMES[d]} ({shape[k]})
                  </Dim>
                </span>
              ))}
              , so the shape is <ShapeText shape={shape} dims={kept} />.
            </>
          )}
        </div>
        {shape.length === 0 ? (
          <ScalarBox name={preset.expr} value={data as number} state="result" />
        ) : (
          <TensorView name={preset.expr} data={data as TensorData} colorDims={false} cellState={() => 'result'} />
        )}
      </div>
    </Figure>
  );
}

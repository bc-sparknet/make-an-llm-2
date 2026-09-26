import { useState } from 'react';
import { Figure, Segmented, StepControls, useStepper } from '../../components';
import { MiniTensor, allIndices, at, build, formatNum, type Nested } from './MiniTensor';
import styles from './widgets.module.css';

/**
 * The centrepiece: reduce a [2, 3, 4] tensor with sum/mean/max over any dim.
 * One output cell is "selected" at a time (tap, or press play to walk through
 * them all); the input cells that were squashed into it light up.
 */

const X: number[][][] = [
  [
    [3, 1, 4, 1],
    [5, 9, 2, 6],
    [5, 3, 5, 8],
  ],
  [
    [9, 7, 9, 3],
    [2, 3, 8, 4],
    [6, 2, 6, 4],
  ],
];
const SHAPE = [2, 3, 4];
const DIM_NAMES = ['batch', 'tokens', 'emb'];

type Op = 'sum' | 'mean' | 'max';
type DimOpt = '0' | '1' | '2' | '-1';

const DIRECTION: Record<number, { arrow: string; text: string }> = {
  0: { arrow: '⇄', text: 'across the two matrices: lay x[0] on top of x[1] and press them flat' },
  1: { arrow: '↓', text: 'down each column, inside each matrix' },
  2: { arrow: '→', text: 'along each row: one token vector at a time' },
};

function reduce(op: Op, values: number[]) {
  if (op === 'sum') return values.reduce((a, b) => a + b, 0);
  if (op === 'mean') return values.reduce((a, b) => a + b, 0) / values.length;
  return Math.max(...values);
}

export function ReduceExplorer() {
  const [op, setOp] = useState<Op>('sum');
  const [dimOpt, setDimOpt] = useState<DimOpt>('2');
  const [keep, setKeep] = useState<'false' | 'true'>('false');
  const d = dimOpt === '-1' ? 2 : Number(dimOpt);
  const keepdim = keep === 'true';

  // "key" = the input index with dim d removed; one key per output value.
  const keyShape = SHAPE.filter((_, i) => i !== d);
  const keys = allIndices(keyShape);
  const stepper = useStepper(keys.length, 900);
  const sel = keys[Math.min(stepper.step, keys.length - 1)];

  const toKey = (index: number[]) => index.filter((_, i) => i !== d);
  const groupOf = (key: number[]) =>
    Array.from({ length: SHAPE[d] }, (_, k) => {
      const idx = [...key];
      idx.splice(d, 0, k);
      return idx;
    });
  const valuesOf = (key: number[]) => groupOf(key).map((idx) => at(X as Nested, idx));

  const outShape = keepdim ? SHAPE.map((n, i) => (i === d ? 1 : n)) : keyShape;
  const outKey = (outIndex: number[]) => (keepdim ? outIndex.filter((_, i) => i !== d) : outIndex);
  const out = build(outShape, (oi) => reduce(op, valuesOf(outKey(oi))));

  const selValues = valuesOf(sel);
  const selResult = reduce(op, selValues);
  const winner = op === 'max' ? selValues.indexOf(selResult) : -1;
  const sameKey = (a: number[], b: number[]) => a.every((v, i) => v === b[i]);

  const inputState = (index: number[]) => {
    if (!sameKey(toKey(index), sel)) return 'faded' as const;
    return op === 'max' && index[d] === winner ? ('win' as const) : ('group' as const);
  };
  const outputState = (oi: number[]) => (sameKey(outKey(oi), sel) ? ('out' as const) : ('normal' as const));
  const selectKey = (key: number[]) => stepper.setStep(keys.findIndex((k) => sameKey(k, key)));

  const outColors = keepdim ? [0, 1, 2] : [0, 1, 2].filter((i) => i !== d);
  const sliceIdx = sel.map(String);
  sliceIdx.splice(d, 0, ':');
  const outIdx = keepdim ? [...sel.slice(0, d), 0, ...sel.slice(d)] : sel;
  const joined = selValues.map((v) => formatNum(v)).join(op === 'max' ? ', ' : ' + ');
  const arithmetic =
    op === 'sum' ? joined : op === 'mean' ? `(${joined}) / ${SHAPE[d]}` : `max(${joined})`;

  return (
    <Figure
      title="Reduce explorer"
      caption="The highlighted input cells all lie along the chosen dim, with every other index held fixed. They collapse into the one highlighted output cell. Every output cell has its own group, and together the groups cover each input exactly once."
    >
      <div className={styles.root}>
      <div className={styles.controlsTwo}>
        <Segmented
          label="Operation"
          value={op}
          onChange={setOp}
          options={[
            { value: 'sum', label: 'sum' },
            { value: 'mean', label: 'mean' },
            { value: 'max', label: 'max' },
          ]}
        />
        <Segmented
          label="keepdim"
          value={keep}
          onChange={setKeep}
          options={[
            { value: 'false', label: 'False' },
            { value: 'true', label: 'True' },
          ]}
        />
      </div>
      <div className={styles.tight}>
      <Segmented
        label="dim"
        value={dimOpt}
        onChange={(v) => {
          setDimOpt(v);
          stepper.reset();
        }}
        options={[
          { value: '0', label: '0' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '-1', label: '−1' },
        ]}
      />
      </div>

      <div className={styles.banner} data-dim={d}>
        <span className={styles.bannerArrow} aria-hidden="true">
          {DIRECTION[d].arrow}
        </span>
        <span>
          Squashing <strong>dim {d}</strong> ({DIM_NAMES[d]}, size {SHAPE[d]})
          {dimOpt === '-1' && ' (−1 is the last dim)'}: {DIRECTION[d].text}.
        </span>
      </div>

      <MiniTensor data={X as Nested} name="x" dimColors={[0, 1, 2]} cellState={inputState} onCellClick={(i) => selectKey(toKey(i))} />

      <div className={styles.shapeFlow} aria-label={`shape [2, 3, 4] becomes [${outShape.join(', ')}]`}>
        <code>
          [
          {SHAPE.map((n, i) => (
            <span key={i}>
              {i > 0 && ', '}
              <span data-dim={i} className={i === d ? (keepdim ? styles.shrunk : styles.struck) : undefined}>
                {n}
              </span>
              {i === d && keepdim && (
                <span data-dim={i} className={styles.shrunkTo}>
                  1
                </span>
              )}
            </span>
          ))}
          ]
        </code>
        <span className={styles.flowArrow}>
          x.{op}(dim={dimOpt}
          {keepdim ? ', keepdim=True' : ''})
        </span>
      </div>

      <MiniTensor
        data={out}
        name="out"
        dimColors={outColors}
        cellState={outputState}
        onCellClick={(oi) => selectKey(outKey(oi))}
        note={keepdim ? `dim ${d} kept, size 1` : `dim ${d} gone`}
      />

      <div className={styles.formula} aria-live="polite">
        <code>
          out[{outIdx.join(', ')}] = {op}(x[{sliceIdx.join(', ')}])
        </code>
        <code>
          = {arithmetic} = <strong>{formatNum(selResult)}</strong>
        </code>
      </div>

      <StepControls stepper={stepper} label={`Output ${stepper.step + 1} of ${keys.length}`} />
      </div>
    </Figure>
  );
}

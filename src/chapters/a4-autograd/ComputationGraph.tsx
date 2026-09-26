import { Figure, StepControls, useStepper } from '../../components';
import styles from './widgets.module.css';

/**
 * The computation graph PyTorch records for loss = (w·x + b − y)², with the
 * same numbers as the chapter's code (x = 2, y = 4, w = 1, b = 0.5).
 * Steps 0–4 are the forward pass (values flow up); steps 5–9 the backward
 * pass (gradients flow down, multiplied by each local slope: the chain rule).
 */

type Kind = 'param' | 'data' | 'op';

interface GraphNode {
  id: string;
  label: string;
  value: number;
  grad?: number;
  kind: Kind;
  fwd: number; // step at which the value is known
  bwd?: number; // step at which the gradient is known
  x: number;
  y: number;
}

const NODES: GraphNode[] = [
  { id: 'w', label: 'w (param)', value: 1, grad: -6, kind: 'param', fwd: 0, bwd: 9, x: 48, y: 345 },
  { id: 'x', label: 'x (data)', value: 2, kind: 'data', fwd: 0, x: 132, y: 345 },
  { id: 'b', label: 'b (param)', value: 0.5, grad: -3, kind: 'param', fwd: 0, bwd: 8, x: 216, y: 345 },
  { id: 'y', label: 'y (data)', value: 4, kind: 'data', fwd: 0, x: 304, y: 345 },
  { id: 'm', label: 'm = w·x', value: 2, grad: -3, kind: 'op', fwd: 1, bwd: 8, x: 90, y: 265 },
  { id: 'p', label: 'p = m + b', value: 2.5, grad: -3, kind: 'op', fwd: 2, bwd: 7, x: 160, y: 190 },
  { id: 'd', label: 'd = p − y', value: -1.5, grad: -3, kind: 'op', fwd: 3, bwd: 6, x: 236, y: 115 },
  { id: 'L', label: 'L = d²', value: 2.25, grad: 1, kind: 'op', fwd: 4, bwd: 5, x: 236, y: 40 },
];

// [input, output]
const EDGES: [string, string][] = [
  ['w', 'm'],
  ['x', 'm'],
  ['m', 'p'],
  ['b', 'p'],
  ['p', 'd'],
  ['y', 'd'],
  ['d', 'L'],
];

const STEPS: { title: string; math?: string }[] = [
  { title: 'The leaves: parameters w and b (requires_grad=True), and the data x and y.' },
  { title: 'Forward: multiply w by x.', math: 'm = w·x = 1 × 2 = 2' },
  { title: 'Forward: add the bias.', math: 'p = m + b = 2 + 0.5 = 2.5' },
  { title: 'Forward: subtract the target. The prediction is 1.5 too low.', math: 'd = p − y = 2.5 − 4 = −1.5' },
  { title: 'Forward: square the error. PyTorch has recorded every operation on the way up.', math: 'L = d² = (−1.5)² = 2.25' },
  { title: 'loss.backward() starts at the top. The loss changes 1-for-1 with itself.', math: '∂L/∂L = 1' },
  { title: 'Local slope of d² is 2d. Multiply by the gradient arriving from above.', math: '∂L/∂d = 1 × 2d = 2 × (−1.5) = −3' },
  { title: 'd = p − y: nudging p by 1 nudges d by 1, so the gradient passes through unchanged.', math: '∂L/∂p = −3 × 1 = −3' },
  { title: 'p = m + b: addition copies the gradient to both inputs. b.grad is done.', math: '∂L/∂m = −3 × 1 = −3    ∂L/∂b = −3 × 1 = −3' },
  { title: 'm = w·x: the local slope with respect to w is x. w.grad is done.', math: '∂L/∂w = −3 × x = −3 × 2 = −6' },
];

const BW = 80;
const BH = 56;
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

const num = (v: number) => String(v).replace('-', '−');

export function ComputationGraph() {
  const stepper = useStepper(STEPS.length, 1800);
  const s = stepper.step;
  const backward = s >= 5;

  return (
    <Figure
      title="A computation graph, forward then backward"
      caption="Every operation on a tensor with requires_grad=True adds a node. backward() walks the graph from the loss down, multiplying each incoming gradient by the operation's local slope (the chain rule). Only the parameters w and b keep a .grad; x and y are data."
    >
      <div className={styles.legend}>
        <span>
          <span className={styles.swatch} data-kind="param" />
          parameter
        </span>
        <span>
          <span className={styles.swatch} data-kind="fwd" />
          forward (value)
        </span>
        <span>
          <span className={styles.swatch} data-kind="bwd" />
          backward (gradient)
        </span>
      </div>

      <svg viewBox="0 0 356 378" className={styles.svg} role="img" aria-label="Computation graph for (w·x + b − y) squared">
        {EDGES.map(([a, b]) => {
          const from = byId[a];
          const to = byId[b];
          let state: string | undefined;
          if (s === to.fwd && !backward) state = 'fwd';
          if (from.bwd !== undefined && s === from.bwd) state = 'bwd';
          return (
            <line
              key={a + b}
              x1={from.x}
              y1={from.y - BH / 2}
              x2={to.x}
              y2={to.y + BH / 2}
              className={styles.edge}
              data-state={state}
            />
          );
        })}
        {NODES.map((n) => {
          const known = s >= n.fwd;
          const gradKnown = n.bwd !== undefined && s >= n.bwd;
          let state: string | undefined;
          if (!backward && s === n.fwd && s > 0) state = 'active-fwd';
          if (n.bwd !== undefined && s === n.bwd) state = 'active-bwd';
          return (
            <g key={n.id}>
              <rect
                x={n.x - BW / 2}
                y={n.y - BH / 2}
                width={BW}
                height={BH}
                rx={9}
                className={styles.nodeBox}
                data-kind={n.kind}
                data-state={state}
              />
              <text x={n.x} y={n.y - 11} textAnchor="middle" className={styles.nodeName}>
                {n.label}
              </text>
              <text x={n.x} y={n.y + 6} textAnchor="middle" className={styles.nodeValue} data-hidden={!known}>
                {known ? num(n.value) : '?'}
              </text>
              {gradKnown && (
                <text x={n.x} y={n.y + 22} textAnchor="middle" className={styles.nodeGrad}>
                  grad {num(n.grad!)}
                </text>
              )}
              {backward && n.kind === 'data' && (
                <text x={n.x} y={n.y + 22} textAnchor="middle" className={styles.nodeName}>
                  no grad
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className={styles.explain} data-phase={backward ? 'bwd' : 'fwd'} aria-live="polite">
        {STEPS[s].title}
        {STEPS[s].math && <span className={styles.math}>{STEPS[s].math}</span>}
      </div>

      <StepControls stepper={stepper} label={`${backward ? 'Backward' : 'Forward'} · ${s + 1} of ${STEPS.length}`} />
    </Figure>
  );
}

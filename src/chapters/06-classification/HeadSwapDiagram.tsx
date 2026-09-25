import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import styles from './HeadSwapDiagram.module.css';

/**
 * The GPT-2 small stack drawn as layers, with a toggle between the pretrained
 * language-modelling head and the new 2-output classification head. In the
 * classifier view, frozen layers get a lock and the trainable ones light up.
 *
 * Parameter counts are exact for GPT-2 small (124M) with a separate, untied
 * output head and qkv_bias=True, as loaded from the OpenAI checkpoint.
 */

type Mode = 'lm' | 'cls';

const MODES = [
  { value: 'lm', label: 'Language model' },
  { value: 'cls', label: 'Spam classifier' },
] as const;

const LM_HEAD = 768 * 50257; // no bias
const CLS_HEAD = 768 * 2 + 2; // with bias
const BLOCK = 7_087_872;
const BODY = 50257 * 768 + 1024 * 768 + 12 * BLOCK + 1536; // everything except the head

interface Layer {
  name: string;
  detail: string;
  params: number;
  /** Trainable during classification fine-tuning? */
  trainable: boolean;
}

const BODY_LAYERS: Layer[] = [
  { name: 'Token embedding', detail: '50,257 × 768', params: 50257 * 768, trainable: false },
  { name: 'Position embedding', detail: '1,024 × 768', params: 1024 * 768, trainable: false },
  { name: 'Transformer blocks 1–11', detail: '11 blocks', params: 11 * BLOCK, trainable: false },
  { name: 'Transformer block 12', detail: 'the last block', params: BLOCK, trainable: true },
  { name: 'Final LayerNorm', detail: 'scale + shift', params: 1536, trainable: true },
];

const n = (x: number) => x.toLocaleString('en-US');
const m = (x: number) => (x >= 1e6 ? `${(x / 1e6).toFixed(1)}M` : x >= 1e3 ? `${(x / 1e3).toFixed(1)}K` : String(x));

export function HeadSwapDiagram() {
  const [mode, setMode] = useState<Mode>('lm');
  const cls = mode === 'cls';
  const head = cls ? CLS_HEAD : LM_HEAD;
  const total = BODY + head;
  const trainable = cls ? BLOCK + 1536 + CLS_HEAD : total;

  return (
    <Figure
      title="Swapping the output head"
      caption="Everything below the head is reused unchanged. For classification we swap a 38.6-million-parameter head for one with just 1,538 parameters, and only train the top of the network."
    >
      <Segmented options={MODES} value={mode} onChange={setMode} />

      <ol className={styles.stack} data-mode={mode}>
        <li className={styles.head} data-kind={mode} key={mode}>
          <span className={styles.icon} aria-hidden="true">
            {cls ? '🔓' : '✏️'}
          </span>
          <span className={styles.name}>
            {cls ? 'Classification head' : 'Language-modelling head'}
            <span className={styles.detail}>{cls ? '768 → 2 (not spam, spam)' : '768 → 50,257 (one per token)'}</span>
          </span>
          <span className={styles.params}>{m(head)}</span>
        </li>
        {[...BODY_LAYERS].reverse().map((l) => {
          const locked = cls && !l.trainable;
          return (
            <li key={l.name} className={styles.layer} data-locked={locked} data-trainable={cls && l.trainable}>
              <span className={styles.icon} aria-label={locked ? 'frozen' : 'trainable'}>
                {!cls ? '✏️' : locked ? '🔒' : '🔓'}
              </span>
              <span className={styles.name}>
                {l.name}
                <span className={styles.detail}>{l.detail}</span>
              </span>
              <span className={styles.params}>{m(l.params)}</span>
            </li>
          );
        })}
      </ol>

      <p className={styles.legend}>
        {cls ? '🔒 frozen (no gradients) · 🔓 updated during fine-tuning' : '✏️ every layer was updated during pretraining'}
      </p>

      <dl className={styles.stats}>
        <div>
          <dt>Total parameters</dt>
          <dd>{n(total)}</dd>
        </div>
        <div>
          <dt>{cls ? 'Trainable now' : 'Trained in pretraining'}</dt>
          <dd className={styles.accent}>
            {n(trainable)}
            {cls && <small> ({((trainable / total) * 100).toFixed(1)}%)</small>}
          </dd>
        </div>
      </dl>
    </Figure>
  );
}

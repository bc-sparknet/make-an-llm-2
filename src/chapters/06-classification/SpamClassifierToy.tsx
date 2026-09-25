import { useMemo, useState } from 'react';
import { Figure, ProbabilityBars } from '../../components';
import { softmax } from '../../lib/math';
import styles from './SpamClassifierToy.module.css';

/**
 * A deliberately simple stand-in for the fine-tuned GPT: hand-picked keyword
 * weights add up to two logits, which go through softmax exactly as the real
 * model's two outputs would. It exists to show the logits → probabilities →
 * label pipeline, not to be a good spam filter.
 */

const EXAMPLES = [
  { name: 'Prize', text: 'You are a winner! Claim your FREE prize now, text WIN to 80082' },
  { name: 'Dinner', text: 'Hey, are we still on for dinner tonight?' },
  { name: 'Urgent', text: 'URGENT: your account has been selected for a cash reward. Call now!' },
  { name: 'Milk', text: 'Can you pick up some milk on the way home?' },
  { name: 'Ticket', text: 'Free entry to the concert, just reply if you want my spare ticket' },
];

/** Positive weights push toward "spam", negative toward "not spam". */
const WEIGHTS: Record<string, number> = {
  free: 1.4,
  win: 1.3,
  winner: 1.6,
  prize: 1.7,
  claim: 1.4,
  cash: 1.3,
  urgent: 1.5,
  reward: 1.2,
  txt: 1.2,
  text: 0.7,
  call: 0.6,
  now: 0.6,
  offer: 1.0,
  selected: 0.9,
  congratulations: 1.5,
  guaranteed: 1.4,
  mobile: 0.6,
  reply: 0.5,
  lol: -1.2,
  ok: -1.0,
  tonight: -0.8,
  home: -0.9,
  dinner: -1.1,
  lunch: -1.0,
  love: -0.7,
  sorry: -1.0,
  later: -0.8,
  thanks: -0.9,
  mum: -1.0,
  you: -0.2,
  we: -0.5,
  me: -0.4,
};

interface Feature {
  label: string;
  weight: number;
}

function score(text: string) {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const features: Feature[] = [];
  for (const w of new Set(words)) {
    if (WEIGHTS[w] !== undefined) features.push({ label: w, weight: WEIGHTS[w] });
  }
  const bangs = (text.match(/!/g) ?? []).length;
  if (bangs) features.push({ label: `"!" × ${bangs}`, weight: 0.5 * Math.min(bangs, 3) });
  const caps = (text.match(/\b[A-Z]{3,}\b/g) ?? []).length;
  if (caps) features.push({ label: `ALL-CAPS × ${caps}`, weight: 0.7 * Math.min(caps, 3) });
  if (/\d{4,}/.test(text)) features.push({ label: 'long number', weight: 1.2 });

  const evidence = features.reduce((s, f) => s + f.weight, 0);
  // Two logits, like the model's 2-output head: [not spam, spam].
  const logits = [0.5 - evidence / 4, -0.5 + evidence / 4];
  return { features, logits, probs: softmax(logits) };
}

export function SpamClassifierToy() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const { features, logits, probs } = useMemo(() => score(text), [text]);
  const pred = probs[1] > probs[0] ? 1 : 0;

  return (
    <Figure
      title="From two logits to a label (toy scorer)"
      caption={
        <>
          <strong>This is not the fine-tuned GPT.</strong> It's a tiny hand-written keyword scorer standing in for it, so
          you can watch two logits become probabilities and a label. The real model computes its two logits from the last
          token's 768-dimensional output, and learns far subtler cues than a word list.
        </>
      }
    >
      <div className={styles.picks}>
        {EXAMPLES.map((ex) => (
          <button key={ex.name} className={styles.pick} data-active={ex.text === text} onClick={() => setText(ex.text)}>
            {ex.name}
          </button>
        ))}
      </div>

      <label className={styles.label} htmlFor="spam-toy-input">
        Message
      </label>
      <textarea
        id="spam-toy-input"
        className={styles.input}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a text message…"
      />

      <div className={styles.features}>
        {features.length === 0 ? (
          <span className={styles.none}>No keywords matched: only the bias counts.</span>
        ) : (
          features.map((f) => (
            <span key={f.label} className={styles.feature} data-sign={f.weight > 0 ? 'spam' : 'ham'}>
              {f.label} {f.weight > 0 ? '+' : '−'}
              {Math.abs(f.weight).toFixed(1)}
            </span>
          ))
        )}
      </div>

      <div className={styles.logits}>
        <div>
          <span>logit[0] not spam</span>
          <code>{logits[0].toFixed(2)}</code>
        </div>
        <div>
          <span>logit[1] spam</span>
          <code>{logits[1].toFixed(2)}</code>
        </div>
      </div>

      <p className={styles.step}>softmax ↓</p>
      <ProbabilityBars labels={['not spam', 'spam']} values={probs} highlight={pred} />

      <p className={styles.verdict} data-label={pred === 1 ? 'spam' : 'ham'}>
        argmax → <strong>{pred === 1 ? 'spam' : 'not spam'}</strong>
      </p>
    </Figure>
  );
}

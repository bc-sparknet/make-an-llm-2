import { useMemo, useState } from 'react';
import { Figure, Segmented, TokenChips } from '../../components';
import { buildVocab, encode, splitWords, UNK } from '../../lib/tokenizer';
import styles from './widgets.module.css';

/**
 * Type any text and watch it become tokens and token IDs. The vocabulary is
 * built from a small "training text"; words outside it become <|unk|>.
 */

const TRAINING_TEXT = `The quick brown fox jumps over the lazy dog. The dog sleeps, and the fox runs away!
Is the fox quick? Yes -- the fox is very quick.`;

const trainingVocab = buildVocab(splitWords(TRAINING_TEXT));

type Mode = 'tokens' | 'ids';

export function TokenizerPlayground() {
  const [text, setText] = useState('The lazy fox sleeps. Is the cat quick?');
  const [mode, setMode] = useState<Mode>('ids');

  const tokens = useMemo(() => splitWords(text), [text]);
  const ids = useMemo(() => encode(tokens, trainingVocab), [tokens]);
  const unkId = trainingVocab.get(UNK)!;
  const unknown = ids.flatMap((id, i) => (id === unkId ? [i] : []));
  const shown = tokens.map((t, i) => (ids[i] === unkId ? UNK : t));

  return (
    <Figure
      title="Tokenizer playground"
      caption={
        <>
          The vocabulary was built from a two-sentence training text, so it only knows {trainingVocab.size} tokens.
          Outlined chips are words it has never seen, which get replaced by <code>{UNK}</code>.
        </>
      }
    >
      <label className={styles.fieldLabel} htmlFor="tok-input">
        Your text
      </label>
      <textarea
        id="tok-input"
        className={styles.textarea}
        value={text}
        rows={2}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      <div className={styles.row}>
        <Segmented
          options={[
            { value: 'tokens', label: 'Tokens' },
            { value: 'ids', label: 'Tokens + IDs' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>
      <TokenChips tokens={shown} ids={mode === 'ids' ? ids : undefined} highlight={unknown} />
      <p className={styles.stat}>
        {tokens.length} tokens · {unknown.length} unknown
      </p>
    </Figure>
  );
}

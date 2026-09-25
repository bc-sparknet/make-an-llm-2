/**
 * Educational tokenizers used by the Chapter 2 playgrounds.
 *
 * - `splitWords` is the simple regex tokenizer built early in the chapter.
 * - `buildVocab` / `encode` / `decode` show how tokens become integer IDs.
 * - `trainBpe` runs byte-pair-encoding merges on a toy corpus so each merge
 *   can be visualised. Real GPT-2 BPE works on bytes and has 50,257 tokens;
 *   the algorithm is the same.
 */

export const UNK = '<|unk|>';
export const END_OF_TEXT = '<|endoftext|>';

/** Splits on whitespace and punctuation, keeping punctuation as tokens. */
export function splitWords(text: string): string[] {
  return text
    .split(/([,.:;?_!"()']|--|\s)/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export type Vocab = Map<string, number>;

export function buildVocab(tokens: string[], specialTokens: string[] = [END_OF_TEXT, UNK]): Vocab {
  const unique = [...new Set(tokens)].sort();
  const vocab: Vocab = new Map();
  [...unique, ...specialTokens].forEach((tok, i) => vocab.set(tok, i));
  return vocab;
}

export function encode(tokens: string[], vocab: Vocab): number[] {
  const unkId = vocab.get(UNK);
  return tokens.map((t) => vocab.get(t) ?? unkId ?? -1);
}

export function decode(ids: number[], vocab: Vocab): string {
  const inverse = new Map([...vocab].map(([tok, id]) => [id, tok]));
  return ids
    .map((id) => inverse.get(id) ?? UNK)
    .join(' ')
    .replace(/\s+([,.?!"()'])/g, '$1');
}

// ---------------------------------------------------------------------------
// Byte-pair encoding
// ---------------------------------------------------------------------------

/** A word is represented as a list of symbols, starting from single characters. */
export type Word = string[];

export interface BpeStep {
  /** The pair merged at this step, e.g. ["l", "o"]. */
  pair: [string, string];
  /** How often the pair appeared across the corpus. */
  count: number;
  /** The corpus words after applying the merge. */
  words: Word[];
  /** The vocabulary after applying the merge. */
  vocab: string[];
}

/** Word-final marker so "low" and the "low" inside "lower" can be told apart. */
export const END_OF_WORD = '_';

export function toSymbols(corpus: string): Word[] {
  return corpus
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => [...w, END_OF_WORD]);
}

export function countPairs(words: Word[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of words) {
    for (let i = 0; i < word.length - 1; i++) {
      const key = `${word[i]}\u0000${word[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

export function mergePair(words: Word[], [a, b]: [string, string]): Word[] {
  return words.map((word) => {
    const merged: Word = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] === a && word[i + 1] === b) {
        merged.push(a + b);
        i++;
      } else {
        merged.push(word[i]);
      }
    }
    return merged;
  });
}

function vocabOf(words: Word[]): string[] {
  return [...new Set(words.flat())].sort((x, y) => y.length - x.length || x.localeCompare(y));
}

/** Runs up to `numMerges` BPE merges and returns a snapshot after each one. */
export function trainBpe(corpus: string, numMerges: number): { initial: Word[]; steps: BpeStep[] } {
  const initial = toSymbols(corpus);
  const steps: BpeStep[] = [];
  let words = initial;
  for (let n = 0; n < numMerges; n++) {
    const counts = countPairs(words);
    if (counts.size === 0) break;
    // Pick the most frequent pair; break ties alphabetically for stable output.
    const [bestKey, bestCount] = [...counts].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))[0];
    if (bestCount < 2) break;
    const pair = bestKey.split('\u0000') as [string, string];
    words = mergePair(words, pair);
    steps.push({ pair, count: bestCount, words, vocab: vocabOf(words) });
  }
  return { initial, steps };
}

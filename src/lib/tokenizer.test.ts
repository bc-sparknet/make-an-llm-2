import { describe, expect, it } from 'vitest';
import { buildVocab, decode, encode, splitWords, trainBpe, UNK } from './tokenizer';

describe('splitWords', () => {
  it('separates punctuation and drops whitespace', () => {
    expect(splitWords('Hello, world. Is this-- a test?')).toEqual([
      'Hello', ',', 'world', '.', 'Is', 'this', '--', 'a', 'test', '?',
    ]);
  });
});

describe('vocab encode/decode', () => {
  const vocab = buildVocab(splitWords('the cat sat.'));

  it('round-trips known text', () => {
    const ids = encode(splitWords('the cat sat.'), vocab);
    expect(decode(ids, vocab)).toBe('the cat sat.');
  });

  it('maps unknown words to <|unk|>', () => {
    const ids = encode(['dog'], vocab);
    expect(ids).toEqual([vocab.get(UNK)]);
  });
});

describe('trainBpe', () => {
  it('merges the most frequent pair first', () => {
    const { steps } = trainBpe('low low low lower', 1);
    expect(steps[0].pair).toEqual(['l', 'o']);
    expect(steps[0].count).toBe(4);
  });

  it('stops when no pair occurs twice', () => {
    const { steps } = trainBpe('ab', 5);
    expect(steps).toHaveLength(0);
  });
});

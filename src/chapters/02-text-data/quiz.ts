import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'Why can\'t we feed raw text directly into a neural network?',
    options: [
      'Text files are too large',
      'Neural networks operate on numbers, so text must be converted to numeric vectors',
      'Text contains punctuation',
      'Neural networks can only read lowercase letters',
    ],
    answer: 1,
    explanation: 'Networks do arithmetic on tensors. Tokenization plus embeddings is how we turn text into numbers they can learn from.',
  },
  {
    prompt: 'What is the main advantage of byte-pair encoding over a word-level vocabulary?',
    options: [
      'It never produces more than one token per word',
      'It is guaranteed to be faster to train',
      'It can represent any word, even unseen ones, by breaking it into known subword pieces',
      'It removes the need for embeddings',
    ],
    answer: 2,
    explanation:
      'Because BPE can always fall back to smaller pieces (down to single bytes), it never needs an `<|unk|>` token.',
  },
  {
    prompt: 'For the input window `[a, small, robot, learned]`, what is the target?',
    options: ['`[a, small, robot, learned]`', '`[small, robot, learned, to]`', '`[learned]`', '`[to]`'],
    answer: 1,
    explanation: 'The target is the input shifted one token to the right: each position is paired with the token that follows it.',
  },
  {
    prompt: 'Using a stride equal to the context length means…',
    options: [
      'Windows overlap heavily',
      'Windows don\'t overlap, so each token appears in exactly one input window',
      'The model sees each token twice',
      'The context length doubles',
    ],
    answer: 1,
    explanation: 'A smaller stride makes windows overlap (more examples, more repetition); a stride equal to the context length tiles the text with no overlap.',
  },
  {
    prompt: 'An embedding layer with a vocabulary of 50,257 and output dimension 768 is essentially…',
    options: [
      'A 768 × 768 attention matrix',
      'A lookup table: a 50,257 × 768 weight matrix, where each token ID selects a row',
      'A function that sorts tokens alphabetically',
      'A fixed, non-trainable one-hot encoding',
    ],
    answer: 1,
    explanation: 'Looking up row `i` is mathematically the same as multiplying a one-hot vector by the weight matrix, just much faster. The weights are learned during training.',
  },
  {
    prompt: 'Why do GPT models add positional embeddings to token embeddings?',
    options: [
      'To make the vectors longer',
      'Because self-attention on its own has no notion of token order',
      'To reduce the vocabulary size',
      'To mark which tokens are unknown',
    ],
    answer: 1,
    explanation: 'Without position information "dog bites man" and "man bites dog" would look identical to attention. GPT learns an absolute position embedding for each slot in the context.',
  },
];

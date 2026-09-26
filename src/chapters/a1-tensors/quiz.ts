import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'A tensor has shape `[4, 10, 32]`. What is its `ndim`, and how many numbers does it hold?',
    options: ['ndim 32, 46 numbers', 'ndim 3, 1,280 numbers', 'ndim 3, 46 numbers', 'ndim 4, 1,280 numbers'],
    answer: 1,
    explanation:
      'ndim is how many entries the shape has (3). The total count is the product of the sizes: 4 × 10 × 32 = 1,280.',
  },
  {
    prompt: 'In `[batch, tokens, emb_dim]` = `[2, 5, 768]`, what does `x[1]` contain?',
    options: [
      'The second feature of every token',
      'The second token of both sentences',
      'All 5 token vectors of the second sentence, shape `[5, 768]`',
      'A single number',
    ],
    answer: 2,
    explanation:
      'The first index always picks along the outermost dimension, here the batch. `x[1]` is the whole second sentence: a `[5, 768]` matrix.',
  },
  {
    prompt: '`x` has shape `[8, 256, 768]`. What is the shape of `x[:, -1, :]`?',
    options: ['`[8, 1, 768]`', '`[256, 768]`', '`[8, 768]`', '`[8, 256]`'],
    answer: 2,
    explanation:
      'The integer `-1` removes the token dimension; the two `:` keep batch and emb_dim. You get the last token vector of each of the 8 sequences.',
  },
  {
    prompt: '`x` has shape `[8, 256, 768]`. What is the shape of `x[:, -1:, :]` (note the colon after -1)?',
    options: ['`[8, 768]`', '`[8, 1, 768]`', '`[8, 255, 768]`', '`[1, 768]`'],
    answer: 1,
    explanation:
      '`-1:` is a slice, and slices keep their dimension. It selects the same data as `-1`, but the token dimension survives with size 1.',
  },
  {
    prompt: 'Multi-head attention gives a tensor of shape `[2, 12, 6, 64]` = `[batch, heads, tokens, head_dim]`. What is `q[0, 3]`?',
    options: [
      'A `[6, 64]` matrix: every token of sentence 0, as seen by head 3',
      'A `[12, 64]` matrix: every head for token 3',
      'A single number',
      'A `[2, 6, 64]` tensor',
    ],
    answer: 0,
    explanation:
      'Two integers remove the first two dimensions (which sentence, which head), leaving one ordinary tokens × head_dim matrix from the grid.',
  },
  {
    prompt: '`ids` has shape `[7]` (one tokenised prompt). A GPT model expects `[batch, tokens]`. Which line gets it into shape?',
    options: ['`ids.unsqueeze(1)`', '`ids.squeeze()`', '`ids.unsqueeze(0)`', '`ids[0]`'],
    answer: 2,
    explanation:
      '`unsqueeze(0)` adds a size-1 dimension at the front, giving `[1, 7]`: a batch of one sequence. `unsqueeze(1)` would give `[7, 1]`, seven sequences of one token each.',
  },
];

import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: '`x` has shape `[8, 256, 768]`. What is `x.mean(dim=-1).shape`?',
    options: ['`[8, 256, 768]`', '`[8, 256]`', '`[256, 768]`', '`[8, 768]`'],
    answer: 1,
    explanation:
      '`dim=-1` is the last dimension (768). Reducing over it makes it disappear, leaving `[8, 256]`: one mean per token of every text.',
  },
  {
    prompt: 'Same `x` of shape `[8, 256, 768]`. What is `x.mean(dim=-1, keepdim=True).shape`?',
    options: ['`[8, 256]`', '`[8, 256, 768]`', '`[8, 256, 1]`', '`[1, 256, 768]`'],
    answer: 2,
    explanation:
      'With `keepdim=True` the reduced dimension stays, but with size 1. That lets the result broadcast back against `x`, as in `x - x.mean(dim=-1, keepdim=True)`.',
  },
  {
    prompt: 'For `x` of shape `[2, 3, 4]`, `out = x.sum(dim=1)`. Which input values are added together to make `out[1, 2]`?',
    options: [
      '`x[1, 2, 0]`, `x[1, 2, 1]`, `x[1, 2, 2]`, `x[1, 2, 3]`',
      '`x[0, 1, 2]` and `x[1, 1, 2]`',
      '`x[1, 0, 2]`, `x[1, 1, 2]`, `x[1, 2, 2]`',
      'All 24 values of `x`',
    ],
    answer: 2,
    explanation:
      'The surviving dims (0 and 2) are fixed at 1 and 2; dim 1 is the one you walk along. So `out[1, 2] = x[1, 0, 2] + x[1, 1, 2] + x[1, 2, 2]`.',
  },
  {
    prompt: 'Attention scores have shape `[tokens, tokens]`, where row `i` holds query `i`\'s scores. You apply `torch.softmax(scores, dim=0)` by mistake. What happens?',
    options: [
      'PyTorch raises a shape error',
      'Nothing changes: softmax gives the same result along either dim',
      'Each column sums to 1 instead of each row, so the rows are no longer valid attention weights',
      'Every value becomes 1',
    ],
    answer: 2,
    explanation:
      'The shapes are fine, so nothing crashes. But softmax normalises along the dim you give it, so the columns sum to 1 and a query\'s row can sum to anything.',
  },
  {
    prompt: 'Which pair of shapes can **not** be broadcast together?',
    options: ['`[2, 3, 4]` and `[3, 4]`', '`[2, 3, 4]` and `[2, 3, 1]`', '`[3, 4]` and `[3]`', '`[3, 1]` and `[1, 4]`'],
    answer: 2,
    explanation:
      'Line shapes up from the right: `[3, 4]` vs `[3]` pairs 4 with 3. They differ and neither is 1, so it fails. To add one number per row, use shape `[3, 1]`.',
  },
  {
    prompt: 'Logits have shape `[batch, tokens, vocab_size]`. What does `logits.argmax(dim=-1)` give you?',
    options: [
      'The largest logit in the whole tensor',
      'For each text and position, the ID of the highest-scoring vocabulary token: shape `[batch, tokens]`',
      'For each vocabulary token, the position where it scores highest',
      'The probabilities of each token',
    ],
    answer: 1,
    explanation:
      'argmax walks along the vocabulary dimension and returns the index of the biggest score. That dimension disappears, leaving one token ID per position.',
  },
];

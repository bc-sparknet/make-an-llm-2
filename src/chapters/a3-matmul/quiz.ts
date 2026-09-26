import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'What is the shape of `[4, 12, 256, 64] @ [4, 12, 64, 256]`?',
    options: ['`[4, 12, 64, 64]`', '`[4, 12, 256, 256]`', '`[4, 12, 256, 64]`', 'An error: the shapes are different'],
    answer: 1,
    explanation:
      'The leading `[4, 12]` are batch dims and carry straight through. The last two dims multiply as matrices: (256×64) @ (64×256) → 256×256. The inner 64s match and disappear. This is the multi-head score shape: batch 4, 12 heads, 256×256 token pairs.',
  },
  {
    prompt: 'A tensor `x` has shape `[2, 3, 4]`. What does `x.view(2, 3, 2, 2)` do?',
    options: [
      'Moves the numbers around so the last dimension is sorted',
      'Splits each length-4 row (the last dim) into 2 groups of 2; no number moves',
      'Stacks two copies of `x`',
      'Raises an error because the number of dims changed',
    ],
    answer: 1,
    explanation:
      'Both shapes hold 24 numbers, and view keeps the reading order. The last dim of 4 is cut into [2, 2], so `x.view(2, 3, 2, 2)[b, t]` is row `x[b, t]` folded into a 2×2 block. This is exactly how attention splits `d_out` into `heads × head_dim`.',
  },
  {
    prompt: 'Queries `Q` and keys `K` both have shape `[6, 8]` (6 tokens, 8 dims). Why do we compute `Q @ K.T` rather than `Q @ K`?',
    options: [
      '`Q @ K` would work too, just more slowly',
      '`K.T` normalises the keys',
      '`Q @ K` fails (inner dims 8 and 6), while `Q @ K.T` is (6×8) @ (8×6) → a 6×6 grid of query-key dot products',
      'Transposing puts the tokens in reverse order, which the causal mask needs',
    ],
    answer: 2,
    explanation:
      'Transposing K turns its token rows into columns. Then entry `[i, j]` of the product is query i dotted with key j: one attention score per pair of tokens.',
  },
  {
    prompt: '`nn.Linear(768, 3072)` is applied to `x` of shape `[2, 10, 768]`. What comes out?',
    options: [
      '`[2, 10, 3072]`: the same weights applied to each of the 20 token vectors',
      '`[2, 3072]`: the tokens get summed',
      '`[3072, 768]`: the weight matrix',
      'An error: Linear only accepts 2-D input',
    ],
    answer: 0,
    explanation:
      'Linear computes `x @ W.T + b`, with `W` of shape `[3072, 768]`. Only the last dim is touched: 768 in, 3072 out. The leading `[2, 10]` are treated as batch dims, so every token vector goes through the same weights.',
  },
  {
    prompt: 'Why does `out.transpose(1, 2).view(b, n, -1)` fail, while `out.transpose(1, 2).contiguous().view(b, n, -1)` works?',
    options: [
      '`transpose` loses some of the numbers, and `contiguous` restores them',
      '`transpose` only changes the order PyTorch walks memory in; `view` needs the reading order to match memory, which `contiguous()` arranges by copying',
      '`view` cannot accept `-1`',
      '`contiguous` moves the tensor to the GPU',
    ],
    answer: 1,
    explanation:
      'After a transpose, walking the tensor in its reading order jumps around in memory. `view` only re-labels existing memory, so it refuses. `.contiguous()` makes a copy laid out in reading order (and `.reshape()` does that for you when needed).',
  },
  {
    prompt: '`t = torch.arange(6).view(2, 3)`. What does `t.T.flatten()` give?',
    options: ['`[0, 1, 2, 3, 4, 5]`', '`[0, 3, 1, 4, 2, 5]`', '`[5, 4, 3, 2, 1, 0]`', '`[0, 2, 4, 1, 3, 5]`'],
    answer: 1,
    explanation:
      '`t` is `[[0, 1, 2], [3, 4, 5]]`, so `t.T` is `[[0, 3], [1, 4], [2, 5]]`. Flattening reads it row by row in its new order: 0, 3, 1, 4, 2, 5. A transpose changes the reading order; a view never does.',
  },
];

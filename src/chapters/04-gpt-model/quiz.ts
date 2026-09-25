import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'Layer normalization rescales each token vector so that, across its embedding dimensions, it has…',
    options: [
      'Values between 0 and 1',
      'Mean 0 and variance 1 (before the learnable scale and shift)',
      'A length of exactly 1',
      'The same values as the previous token',
    ],
    answer: 1,
    explanation:
      'LayerNorm subtracts the mean and divides by the standard deviation over the last dimension. The learnable `scale` and `shift` can then move it away from 0/1 if that helps the model.',
  },
  {
    prompt: 'How does GELU differ from ReLU?',
    options: [
      'GELU is linear everywhere',
      'GELU outputs only 0 or 1',
      'GELU is smooth and lets small negative inputs produce small negative outputs',
      'GELU is only used in the attention layer',
    ],
    answer: 2,
    explanation:
      'ReLU has a hard corner at 0 and flattens every negative input to 0. GELU curves smoothly through that region, which tends to make optimisation easier.',
  },
  {
    prompt: 'What is the shape of the feed-forward network inside each GPT-2 small block?',
    options: ['768 → 768', '768 → 3072 → 768', '768 → 192 → 768', '3072 → 768 → 3072'],
    answer: 1,
    explanation:
      'It expands each token vector 4× to 3,072 dimensions, applies GELU, then projects back to 768 so the output matches the input shape.',
  },
  {
    prompt: 'Why do shortcut (residual) connections help deep networks train?',
    options: [
      'They reduce the number of parameters',
      'They give gradients a direct path back to early layers, so they don’t vanish',
      'They replace the need for attention',
      'They make the model generate text faster',
    ],
    answer: 1,
    explanation:
      'Because each sub-layer’s input is added to its output, the gradient of the sum always includes an identity term that flows straight through, no matter how many layers there are.',
  },
  {
    prompt: 'GPT-2 small has about 163M parameters as built, but is usually quoted as 124M. Why?',
    options: [
      'The dropout layers are removed after training',
      'The original GPT-2 reuses the token-embedding matrix as the output head (weight tying)',
      'Half of the attention heads are pruned',
      'The positional embeddings are not counted',
    ],
    answer: 1,
    explanation:
      'The output head is a 768 × 50,257 matrix, about 38.6M parameters. Sharing it with the token embedding removes those from the count.',
  },
  {
    prompt: 'In the greedy generation loop, which logits are used to choose the next token?',
    options: [
      'The average over all positions',
      'The first position’s',
      'The last position’s',
      'A randomly chosen position’s',
    ],
    answer: 2,
    explanation:
      'The model outputs next-token scores for every position, but only the last position has seen the whole context, and its prediction is the one that extends the text.',
  },
];

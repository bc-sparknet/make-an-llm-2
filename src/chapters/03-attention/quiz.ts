import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'In the simplified self-attention (no trainable weights), how is the attention score between two tokens computed?',
    options: [
      'By counting how many letters the two words share',
      'As the dot product of their embedding vectors',
      'By subtracting one embedding from the other',
      'By looking up a fixed table of word pairs',
    ],
    answer: 1,
    explanation:
      'The dot product multiplies matching entries and adds them up. Vectors pointing in similar directions give a large score; unrelated ones give a small score.',
  },
  {
    prompt: 'Why are attention scores divided by `√d_k` before the softmax?',
    options: [
      'To make the weights sum to 1',
      'To stop the model attending to future tokens',
      'Dot products grow with the key dimension; without scaling, softmax becomes nearly one-hot and gradients vanish',
      'To reduce the number of parameters',
    ],
    answer: 2,
    explanation:
      'With many dimensions, dot products get large in magnitude. Softmax of large numbers puts almost all weight on one entry, where gradients are tiny. Scaling keeps the scores in a comfortable range.',
  },
  {
    prompt: 'In trainable self-attention, which vectors are combined by the attention weights to produce the context vector?',
    options: ['The queries', 'The keys', 'The values', 'The raw scores'],
    answer: 2,
    explanation:
      'Queries and keys are only used to compute the weights. The context vector is the weighted sum of the **value** vectors.',
  },
  {
    prompt: 'A causal mask sets the scores above the diagonal to `-inf` before softmax. What does that achieve?',
    options: [
      'Each token can only attend to itself and earlier tokens',
      'Each token can only attend to later tokens',
      'It randomly hides tokens to prevent overfitting',
      'It removes padding tokens from the batch',
    ],
    answer: 0,
    explanation:
      '`exp(-inf)` is 0, so future positions get exactly zero weight, and the remaining weights in each row still sum to 1. A model trained to predict the next token must not peek at it.',
  },
  {
    prompt: 'With dropout rate `p = 0.5` applied to attention weights during training, what happens to the weights that are kept?',
    options: [
      'They are left unchanged',
      'They are halved',
      'They are doubled (scaled by `1/(1-p)`)',
      'They are renormalised so each row sums to exactly 1',
    ],
    answer: 2,
    explanation:
      'PyTorch uses "inverted" dropout: survivors are scaled by `1/(1-p)` so the expected size of the output matches evaluation mode, where dropout is switched off.',
  },
  {
    prompt: 'A multi-head attention layer has `d_out = 768` and `num_heads = 12`. What is the size of each head\'s queries, keys and values?',
    options: ['12', '64', '768', '9216'],
    answer: 1,
    explanation:
      'The output dimension is split evenly: 768 / 12 = 64 per head. After each head runs, the 12 results are concatenated back into 768 values and passed through the output projection.',
  },
];

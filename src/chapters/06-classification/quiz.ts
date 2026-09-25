import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'The SMS dataset has far more "ham" than "spam" messages. What did we do about it?',
    options: [
      'Duplicated spam messages until the classes matched',
      'Randomly dropped ham messages until both classes had the same count',
      'Weighted the loss so spam errors count 6× more',
      'Nothing: imbalance does not matter for fine-tuning',
    ],
    answer: 1,
    explanation:
      'We **undersampled** the majority class: keep all 747 spam messages and a random 747 of the ham ones. It throws data away, but keeps things simple and makes accuracy a fair metric.',
  },
  {
    prompt: 'Why is every message padded with token ID `50256`?',
    options: [
      'It tells the model the message is spam',
      'It is the ID of the space character',
      'Tensors in a batch must be rectangular, so shorter messages are filled up to a common length',
      'GPT-2 can only read inputs of exactly 1,024 tokens',
    ],
    answer: 2,
    explanation:
      '`50256` is `<|endoftext|>`, which GPT-2 already knows. Padding with it lets messages of different lengths be stacked into one tensor.',
  },
  {
    prompt: 'The new output layer is `torch.nn.Linear(768, 2)`. What does its output represent?',
    options: [
      'Two logits per token: one for "not spam" and one for "spam"',
      'The probabilities of the next two tokens',
      'A 768-dimensional embedding of the message',
      'The loss and the accuracy',
    ],
    answer: 0,
    explanation:
      'Instead of 50,257 scores (one per vocabulary token), each position now produces two scores. Softmax turns them into class probabilities.',
  },
  {
    prompt: 'Why do we classify using only the **last** token\'s output?',
    options: [
      'It is the shortest vector',
      'Because of causal attention, it is the only position that has attended to every token in the message',
      'The first tokens are always padding',
      'The last token has the highest loss',
    ],
    answer: 1,
    explanation:
      'The causal mask lets each token look only at itself and earlier tokens. The final position is the only one whose representation depends on the whole input.',
  },
  {
    prompt: 'Which parts of the model did we leave **trainable** during fine-tuning?',
    options: [
      'Only the token embeddings',
      'All 12 transformer blocks, but not the head',
      'The new classification head, the final LayerNorm and the last transformer block',
      'Nothing: fine-tuning only changes the dataset',
    ],
    answer: 2,
    explanation:
      'The lower layers hold general language knowledge we want to keep. Training just the top block, the final norm and the new head is fast and works well.',
  },
];

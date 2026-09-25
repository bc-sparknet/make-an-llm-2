import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'For the input tokens `[A, B, C, D]` in a training batch, what are the targets?',
    options: [
      'The same tokens, `[A, B, C, D]`',
      'The tokens shifted one to the left: `[B, C, D, E]`, where E is the token after D',
      'Only the final token, `D`',
      'Human-written labels for each token',
    ],
    answer: 1,
    explanation:
      'Every position is trained to predict the token that follows it, so the targets are simply the inputs shifted by one position.',
  },
  {
    prompt: 'The model gives the correct next token a probability of 0.01. What is the cross-entropy loss for that position?',
    options: ['0.01', 'About 0.99', 'About 4.6', 'About 100'],
    answer: 2,
    explanation: '−ln(0.01) ≈ 4.6. Low probabilities on the correct token are punished heavily, because −log grows without bound as p → 0.',
  },
  {
    prompt: 'A model has an average loss of ln(50) ≈ 3.9 on some text. What is its perplexity, and what does it mean?',
    options: [
      '3.9: it gets 3.9 tokens wrong per sentence',
      '50: it is roughly as uncertain as choosing uniformly among 50 tokens',
      '0.02: it is correct 2% of the time',
      '50: it has seen the text 50 times',
    ],
    answer: 1,
    explanation: 'Perplexity is exp(loss). A perplexity of 50 means the model is, on average, as unsure as a uniform guess among 50 options.',
  },
  {
    prompt: 'Training loss keeps falling but validation loss has started to rise. What is most likely happening?',
    options: [
      'The learning rate is too small',
      'The model is overfitting: memorising the training text',
      'The validation set is too large',
      'The model has fully converged and should generalise well',
    ],
    answer: 1,
    explanation:
      'A widening gap between training and validation loss is the classic sign of overfitting, especially on a tiny dataset trained for many epochs.',
  },
  {
    prompt: 'What does setting the temperature **below 1** do to the next-token distribution?',
    options: [
      'Flattens it, making rare tokens more likely',
      'Removes all but the top k tokens',
      'Sharpens it, concentrating probability on the most likely tokens',
      'Has no effect when sampling',
    ],
    answer: 2,
    explanation:
      'Dividing logits by a number smaller than 1 stretches the gaps between them, so softmax puts even more mass on the top tokens. As T → 0 it becomes greedy decoding.',
  },
  {
    prompt: 'Why save the optimizer’s `state_dict` alongside the model’s when checkpointing?',
    options: [
      'The model cannot be loaded without it',
      'AdamW keeps running averages per weight; restoring them lets training resume smoothly',
      'It contains the tokenizer vocabulary',
      'It makes the saved file smaller',
    ],
    answer: 1,
    explanation:
      'Adaptive optimizers like AdamW track moving averages of gradients for every parameter. Without them, resumed training starts those statistics from scratch.',
  },
];

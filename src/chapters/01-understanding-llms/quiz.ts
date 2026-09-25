import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'What task is a GPT-style model trained on during pretraining?',
    options: [
      'Classifying documents into topics',
      'Predicting the next token given the previous tokens',
      'Translating between English and French',
      'Answering questions from a labeled dataset',
    ],
    answer: 1,
    explanation:
      'Pretraining is plain next-token prediction. Translation, classification and Q&A abilities emerge from it or are added by fine-tuning.',
  },
  {
    prompt: 'Why is pretraining often called **self-supervised**?',
    options: [
      'The model decides which data to train on',
      'Humans supervise only the first few steps',
      'The labels (the next tokens) come from the text itself',
      'It uses reinforcement learning from its own outputs',
    ],
    answer: 2,
    explanation: 'Every position in a text already contains its own target: the token that follows it. No human labeling is required.',
  },
  {
    prompt: 'The original transformer had an encoder and a decoder. Which part does GPT keep?',
    options: ['Only the encoder', 'Only the decoder', 'Both', 'Neither: it uses an RNN'],
    answer: 1,
    explanation:
      'GPT is decoder-only: it generates text left-to-right. Encoder-only models like BERT are better suited to understanding tasks such as classification.',
  },
  {
    prompt: 'Which statement about fine-tuning is true?',
    options: [
      'It requires far more data than pretraining',
      'It starts from random weights',
      'It adapts a pretrained model using a smaller, task-specific dataset',
      'It can only be used for classification',
    ],
    answer: 2,
    explanation:
      'Fine-tuning reuses everything learned during pretraining and nudges the model toward a specific task, such as classification or instruction following.',
  },
];

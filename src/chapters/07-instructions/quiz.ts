import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'You ask a **base** (pretrained only) model: "List three fruits." What is it most likely to do?',
    options: [
      'Reply "Apple, banana, cherry." and stop',
      'Continue the text, perhaps with more questions or unrelated sentences',
      'Refuse, because it was not trained on fruit',
      'Output a spam/not-spam label',
    ],
    answer: 1,
    explanation:
      'A base model only knows how to continue text. Instruction fine-tuning teaches it the pattern "instruction, then a helpful response, then stop".',
  },
  {
    prompt: 'In the Alpaca-style template, what happens when an entry\'s `input` field is empty?',
    options: [
      'The entry is removed from the dataset',
      'The `### Input:` section is left out of the prompt',
      'The word "None" is inserted as the input',
      'The instruction is copied into the input',
    ],
    answer: 1,
    explanation: 'Many tasks need no extra context. The template simply skips the input section so the prompt stays clean.',
  },
  {
    prompt: 'Why does the collate function replace padding tokens in the **targets** with `-100`?',
    options: [
      'Negative IDs make training faster',
      '`-100` is the ID of a special "pad" token in GPT-2',
      'PyTorch\'s `cross_entropy` ignores targets equal to `-100` by default, so padding doesn\'t affect the loss',
      'It prevents the model from seeing padding in its inputs',
    ],
    answer: 2,
    explanation:
      '`cross_entropy` has `ignore_index=-100` by default. Those positions contribute nothing to the loss or the gradients. The inputs still contain `50256`.',
  },
  {
    prompt: 'Why is the **first** `50256` in each target row kept, rather than replaced with `-100`?',
    options: [
      'So the model learns to produce an end-of-text token when its response is finished',
      'Because PyTorch requires at least one real token per row',
      'It marks where the instruction ends',
      'It is a bug that happens not to matter',
    ],
    answer: 0,
    explanation:
      'Predicting end-of-text is how the model learns to stop. Without it, a fine-tuned model would keep generating past the end of its answer.',
  },
  {
    prompt: 'What does it mean to **mask the instruction** tokens in the targets?',
    options: [
      'Deleting the instruction from the input',
      'Setting their targets to `-100` so the loss only covers the response',
      'Encrypting the instruction',
      'Replacing the instruction with padding',
    ],
    answer: 1,
    explanation:
      'The model still reads the instruction, but is only graded on the response. It is optional; whether it helps depends on the data.',
  },
  {
    prompt: 'Why use a larger LLM as a **judge** to evaluate responses?',
    options: [
      'Free-form answers can be correct in many wordings, so exact-match accuracy is too strict',
      'It makes the fine-tuned model larger',
      'It is the only way to compute cross-entropy',
      'It guarantees perfectly objective scores',
    ],
    answer: 0,
    explanation:
      'A judge model can recognise that "3,000 m" and "three thousand metres" mean the same thing. Its scores are useful but not perfect, so spot-check them.',
  },
];

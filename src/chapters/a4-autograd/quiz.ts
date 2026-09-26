import type { QuizQuestion } from '../../components';

export const quiz: QuizQuestion[] = [
  {
    prompt: 'A parameter has gradient `+4.0`. Which way does a gradient-descent step move it?',
    options: [
      'Up, because the gradient is positive',
      'Down, because the loss rises as the parameter rises',
      'It stays put until the gradient is exactly 0',
      'It depends on the batch size only',
    ],
    answer: 1,
    explanation:
      'A positive gradient means increasing the parameter increases the loss. The update `w ← w − lr · grad` subtracts, so w moves down: downhill.',
  },
  {
    prompt: 'You raise the learning rate and the loss starts growing every step, eventually reaching `inf`. What is happening?',
    options: [
      'The model has too few parameters',
      'The gradients are being zeroed too often',
      'Each step is so large it jumps past the minimum to a higher point, and the overshoot grows',
      'The loss function is broken',
    ],
    answer: 2,
    explanation:
      'With too big a learning rate, every step overshoots the bottom by more than the last. That is divergence. Lower the learning rate.',
  },
  {
    prompt: 'What happens if you forget `optimizer.zero_grad()` in the training loop?',
    options: [
      'PyTorch raises an error on the second batch',
      'Nothing: `backward()` overwrites `.grad` each time',
      'The gradients from every batch add up in `.grad`, so updates use stale, ever-growing gradients',
      'The model switches to evaluation mode',
    ],
    answer: 2,
    explanation:
      '`backward()` adds into `.grad` rather than replacing it. Without clearing, each step uses the sum of all previous gradients, which usually makes training unstable.',
  },
  {
    prompt: 'With `loss = (w*x + b - y)**2`, `x = 2`, `y = 4`, `w = 1`, `b = 0.5`, what is `w.grad` after `loss.backward()`?',
    options: ['`-3`', '`2.25`', '`-6`', '`6`'],
    answer: 2,
    explanation:
      'The error is `2.5 − 4 = −1.5`. The slope of the square is `2 × (−1.5) = −3`, and the slope of `w·x` with respect to w is `x = 2`. Chain rule: `−3 × 2 = −6`.',
  },
  {
    prompt: 'Why do we wrap evaluation code in `with torch.no_grad():`?',
    options: [
      'It makes the model more accurate',
      'It skips building the computation graph, saving memory and time when we will not call backward()',
      'It turns dropout off',
      'It resets the gradients to zero',
    ],
    answer: 1,
    explanation:
      '`no_grad()` only stops gradient tracking. Turning dropout off is the job of `model.eval()`, which is why evaluation code usually uses both.',
  },
  {
    prompt: 'A `DataLoader` has a dataset of 10 examples, `batch_size=4` and `drop_last=True`. How many batches does one epoch give?',
    options: ['2', '3', '4', '10'],
    answer: 0,
    explanation:
      '10 examples make two full batches of 4 and a leftover batch of 2. `drop_last=True` throws away the incomplete batch, leaving 2.',
  },
];

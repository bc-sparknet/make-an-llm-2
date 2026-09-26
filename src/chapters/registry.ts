import { lazy, type ComponentType } from 'react';

/**
 * The single source of truth for the course outline.
 *
 * To add a chapter:
 *   1. Create `src/chapters/NN-your-slug/index.mdx` (main track) or
 *      `src/chapters/aN-your-slug/index.mdx` (optional Foundations track).
 *   2. Add an entry below. Order in this array is the reading order; prev/next
 *      links stay within a track.
 *
 * Chapter content is lazy-loaded so the first page stays small on mobile.
 */

/**
 * - main: the seven chapters that build the LLM, read in order.
 * - foundations: optional PyTorch/tensor background, dip in when needed.
 */
export type Track = 'main' | 'foundations';

export const trackInfo: Record<Track, { title: string; description: string }> = {
  main: {
    title: 'Build the model',
    description: 'Seven chapters, from raw text to an instruction-following GPT.',
  },
  foundations: {
    title: 'Foundations (optional)',
    description:
      'Tensor and PyTorch basics. Read them first if PyTorch is new to you, or jump in whenever shapes start to blur.',
  },
};

export interface ChapterMeta {
  slug: string;
  /** Short label shown in badges: "1"–"7" for the main track, "A1"… for Foundations. */
  label: string;
  track: Track;
  title: string;
  /** One-line teaser shown on the home page. */
  summary: string;
  /** Rough reading + playing time, in minutes. */
  minutes: number;
  load: () => Promise<{ default: ComponentType }>;
}

export const chapters: ChapterMeta[] = [
  {
    slug: 'understanding-llms',
    label: '1',
    track: 'main',
    title: 'Understanding Large Language Models',
    summary: 'What an LLM is, where transformers came from, and the three stages of building one.',
    minutes: 12,
    load: () => import('./01-understanding-llms/index.mdx'),
  },
  {
    slug: 'text-data',
    label: '2',
    track: 'main',
    title: 'Working with Text Data',
    summary: 'Turn raw text into tokens, token IDs, and finally the vectors a network can learn from.',
    minutes: 25,
    load: () => import('./02-text-data/index.mdx'),
  },
  {
    slug: 'attention',
    label: '3',
    track: 'main',
    title: 'Coding Attention Mechanisms',
    summary: 'Build self-attention step by step, then add causal masking and multiple heads.',
    minutes: 30,
    load: () => import('./03-attention/index.mdx'),
  },
  {
    slug: 'gpt-model',
    label: '4',
    track: 'main',
    title: 'Implementing a GPT Model',
    summary: 'Assemble layer norm, GELU, shortcuts and attention into a full transformer that generates text.',
    minutes: 30,
    load: () => import('./04-gpt-model/index.mdx'),
  },
  {
    slug: 'pretraining',
    label: '5',
    track: 'main',
    title: 'Pretraining on Unlabeled Data',
    summary: 'Measure loss, write a training loop, and control generation with temperature and top-k.',
    minutes: 25,
    load: () => import('./05-pretraining/index.mdx'),
  },
  {
    slug: 'classification',
    label: '6',
    track: 'main',
    title: 'Fine-tuning for Classification',
    summary: 'Swap the output head and teach a pretrained model to spot spam.',
    minutes: 20,
    load: () => import('./06-classification/index.mdx'),
  },
  {
    slug: 'instructions',
    label: '7',
    track: 'main',
    title: 'Fine-tuning to Follow Instructions',
    summary: 'Format instruction data, batch it efficiently, and evaluate a chat-style model.',
    minutes: 25,
    load: () => import('./07-instructions/index.mdx'),
  },
  {
    slug: 'tensors',
    label: 'A1',
    track: 'foundations',
    title: 'Tensors and Shapes',
    summary: 'What a tensor is, what each dimension of a shape means, and how indexing picks pieces out.',
    minutes: 15,
    load: () => import('./a1-tensors/index.mdx'),
  },
  {
    slug: 'dimensions',
    label: 'A2',
    track: 'foundations',
    title: 'Working Along a Dimension',
    summary: 'What dim= really does in sum, mean, softmax and layer norm, plus broadcasting.',
    minutes: 15,
    load: () => import('./a2-dimensions/index.mdx'),
  },
  {
    slug: 'matmul',
    label: 'A3',
    track: 'foundations',
    title: 'Matrix Multiplication and Reshaping',
    summary: 'Matmul as many dot products, batched @ in higher dimensions, and view/transpose/permute.',
    minutes: 20,
    load: () => import('./a3-matmul/index.mdx'),
  },
  {
    slug: 'autograd',
    label: 'A4',
    track: 'foundations',
    title: 'Autograd and the Training Loop',
    summary: 'How PyTorch computes gradients, and the nn.Module, optimizer and DataLoader pattern.',
    minutes: 20,
    load: () => import('./a4-autograd/index.mdx'),
  },
];

/** "Chapter 3" or "Foundations A2". */
export function chapterName(c: ChapterMeta): string {
  return c.track === 'main' ? `Chapter ${c.label}` : `Foundations ${c.label}`;
}

export const chaptersInTrack = (track: Track) => chapters.filter((c) => c.track === track);

/** Pre-built lazy components, keyed by slug. */
export const chapterComponents: Record<string, ComponentType> = Object.fromEntries(
  chapters.map((c) => [c.slug, lazy(c.load)]),
);

export function findChapter(slug: string | undefined): {
  chapter?: ChapterMeta;
  prev?: ChapterMeta;
  next?: ChapterMeta;
} {
  const chapter = chapters.find((c) => c.slug === slug);
  if (!chapter) return {};
  const siblings = chaptersInTrack(chapter.track);
  const index = siblings.indexOf(chapter);
  return { chapter, prev: siblings[index - 1], next: siblings[index + 1] };
}

import { lazy, type ComponentType } from 'react';

/**
 * The single source of truth for the course outline.
 *
 * To add a chapter:
 *   1. Create `src/chapters/NN-your-slug/index.mdx`.
 *   2. Add an entry below. Order in this array is the reading order.
 *
 * Chapter content is lazy-loaded so the first page stays small on mobile.
 */

export interface ChapterMeta {
  slug: string;
  number: number;
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
    number: 1,
    title: 'Understanding Large Language Models',
    summary: 'What an LLM is, where transformers came from, and the three stages of building one.',
    minutes: 12,
    load: () => import('./01-understanding-llms/index.mdx'),
  },
  {
    slug: 'text-data',
    number: 2,
    title: 'Working with Text Data',
    summary: 'Turn raw text into tokens, token IDs, and finally the vectors a network can learn from.',
    minutes: 25,
    load: () => import('./02-text-data/index.mdx'),
  },
  {
    slug: 'attention',
    number: 3,
    title: 'Coding Attention Mechanisms',
    summary: 'Build self-attention step by step, then add causal masking and multiple heads.',
    minutes: 30,
    load: () => import('./03-attention/index.mdx'),
  },
  {
    slug: 'gpt-model',
    number: 4,
    title: 'Implementing a GPT Model',
    summary: 'Assemble layer norm, GELU, shortcuts and attention into a full transformer that generates text.',
    minutes: 30,
    load: () => import('./04-gpt-model/index.mdx'),
  },
  {
    slug: 'pretraining',
    number: 5,
    title: 'Pretraining on Unlabeled Data',
    summary: 'Measure loss, write a training loop, and control generation with temperature and top-k.',
    minutes: 25,
    load: () => import('./05-pretraining/index.mdx'),
  },
  {
    slug: 'classification',
    number: 6,
    title: 'Fine-tuning for Classification',
    summary: 'Swap the output head and teach a pretrained model to spot spam.',
    minutes: 20,
    load: () => import('./06-classification/index.mdx'),
  },
  {
    slug: 'instructions',
    number: 7,
    title: 'Fine-tuning to Follow Instructions',
    summary: 'Format instruction data, batch it efficiently, and evaluate a chat-style model.',
    minutes: 25,
    load: () => import('./07-instructions/index.mdx'),
  },
];

/** Pre-built lazy components, keyed by slug. */
export const chapterComponents: Record<string, ComponentType> = Object.fromEntries(
  chapters.map((c) => [c.slug, lazy(c.load)]),
);

export function findChapter(slug: string | undefined) {
  const index = chapters.findIndex((c) => c.slug === slug);
  return {
    chapter: chapters[index],
    prev: index > 0 ? chapters[index - 1] : undefined,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : undefined,
  };
}

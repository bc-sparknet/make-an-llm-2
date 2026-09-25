import { useCallback, useSyncExternalStore } from 'react';

/**
 * Learner progress, persisted in localStorage.
 *
 * Shape: { [chapterSlug]: { quiz?: { correct, total }, completed?: boolean } }
 * Storage can be unavailable (private mode, blocked cookies); every access is
 * wrapped so the site keeps working, it just won't remember progress.
 */

const STORAGE_KEY = 'build-an-llm:progress:v1';

export interface ChapterProgress {
  completed?: boolean;
  quiz?: { correct: number; total: number };
}

type ProgressMap = Record<string, ChapterProgress>;

let cache: ProgressMap = load();
const listeners = new Set<() => void>();

function load(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as ProgressMap;
  } catch {
    return {};
  }
}

function save(next: ProgressMap) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in-memory only */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, () => cache);
}

export function useChapterProgress(slug: string) {
  const all = useProgress();
  const update = useCallback(
    (patch: Partial<ChapterProgress>) => save({ ...cache, [slug]: { ...cache[slug], ...patch } }),
    [slug],
  );
  return [all[slug] ?? {}, update] as const;
}

export function resetProgress() {
  save({});
}

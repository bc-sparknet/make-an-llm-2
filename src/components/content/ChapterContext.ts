import { createContext, useContext } from 'react';

/** Lets components inside chapter MDX know which chapter they belong to. */
export const ChapterContext = createContext<{ slug: string }>({ slug: '' });

export const useChapter = () => useContext(ChapterContext);

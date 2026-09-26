import config from '../../../site.config.json';
import notebooks from '../../chapters/notebooks.json';
import styles from './OpenInColab.module.css';

const manifest: Record<string, string> = notebooks;

/** Colab URL for a chapter's generated notebook, or undefined if it has none. */
export function colabUrl(slug: string): string | undefined {
  const path = manifest[slug];
  if (!path) return undefined;
  return `https://colab.research.google.com/github/${config.githubRepo}/blob/${config.githubBranch}/${path}`;
}

/** Button linking to this chapter's code as a runnable Colab notebook. */
export function OpenInColab({ slug }: { slug: string }) {
  const url = colabUrl(slug);
  if (!url) return null;
  return (
    <a className={styles.button} href={url} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M8 5l-5 7 5 7M16 5l5 7-5 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Run this chapter&rsquo;s code in Colab
    </a>
  );
}

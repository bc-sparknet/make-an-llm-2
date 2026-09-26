import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { chapters, chapterName } from '../../chapters/registry';
import styles from './FoundationLink.module.css';

interface Props {
  /** Slug of the Foundations chapter to point to, e.g. "dimensions". */
  to: string;
  /** Why the reader might want it, e.g. "Not sure what dim=-1 means here?". */
  children: ReactNode;
}

/** A compact pointer from a main chapter to an optional Foundations chapter. */
export function FoundationLink({ to, children }: Props) {
  const target = chapters.find((c) => c.slug === to);
  if (!target) throw new Error(`FoundationLink: unknown chapter "${to}"`);
  return (
    <Link to={`/chapter/${to}`} className={styles.link}>
      <span className={styles.badge}>{target.label}</span>
      <span>
        {children} <span className={styles.target}>{chapterName(target)}: {target.title} →</span>
      </span>
    </Link>
  );
}

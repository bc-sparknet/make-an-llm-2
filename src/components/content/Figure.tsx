import type { ReactNode } from 'react';
import styles from './Figure.module.css';

interface Props {
  /** Short heading shown at the top of the card. */
  title?: string;
  /** Explanatory text shown under the visual. */
  caption?: ReactNode;
  children: ReactNode;
}

/** A card that frames an interactive visual so it stands apart from the prose. */
export function Figure({ title, caption, children }: Props) {
  return (
    <figure className={styles.figure}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.body}>{children}</div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

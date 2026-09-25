import type { ReactNode } from 'react';
import styles from './Callout.module.css';

type Variant = 'note' | 'tip' | 'key' | 'warning';

const labels: Record<Variant, string> = {
  note: 'Note',
  tip: 'Try it',
  key: 'Key idea',
  warning: 'Watch out',
};

interface Props {
  type?: Variant;
  title?: string;
  children: ReactNode;
}

export function Callout({ type = 'note', title, children }: Props) {
  return (
    <aside className={styles.callout} data-type={type}>
      <div className={styles.label}>{title ?? labels[type]}</div>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}

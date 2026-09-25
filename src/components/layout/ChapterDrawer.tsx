import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { chapters } from '../../chapters/registry';
import { useProgress } from '../../lib/progress';
import styles from './ChapterDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChapterDrawer({ open, onClose }: Props) {
  const progress = useProgress();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      <div className={styles.backdrop} data-open={open} onClick={onClose} aria-hidden="true" />
      <nav className={styles.drawer} data-open={open} aria-label="Chapters" aria-hidden={!open} inert={!open}>
        <div className={styles.heading}>
          <span>Chapters</span>
          <button className={styles.close} onClick={onClose} aria-label="Close chapter list">
            ×
          </button>
        </div>
        <NavLink to="/" end className={styles.item}>
          <span className={styles.number}>⌂</span>
          <span className={styles.title}>Home</span>
        </NavLink>
        {chapters.map((c) => (
          <NavLink key={c.slug} to={`/chapter/${c.slug}`} className={styles.item}>
            <span className={styles.number} data-done={!!progress[c.slug]?.completed}>
              {progress[c.slug]?.completed ? '✓' : c.number}
            </span>
            <span className={styles.title}>{c.title}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

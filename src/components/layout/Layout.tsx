import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ChapterDrawer } from './ChapterDrawer';
import { ThemeToggle } from './ThemeToggle';
import styles from './Layout.module.css';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the drawer and jump to the top whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button
          className={styles.iconButton}
          aria-label="Open chapter list"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Link to="/" className={styles.brand}>
          Build an LLM
        </Link>
        <ThemeToggle />
      </header>

      <ChapterDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        An independent study companion that follows the progression of Sebastian Raschka&rsquo;s{' '}
        <em>Build a Large Language Model (From Scratch)</em>. Not affiliated with the author or publisher.
      </footer>
    </div>
  );
}

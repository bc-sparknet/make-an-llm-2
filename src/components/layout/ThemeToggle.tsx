import { useTheme, type Theme } from '../../lib/theme';
import styles from './Layout.module.css';

const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const label: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  return (
    <button
      className={styles.iconButton}
      onClick={() => setTheme(next[theme])}
      aria-label={`Theme: ${label[theme]}. Tap to change.`}
      title={`Theme: ${label[theme]}`}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="currentColor" />
        </svg>
      ) : theme === 'light' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <path
            d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}

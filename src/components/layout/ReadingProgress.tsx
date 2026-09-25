import { useEffect, useState } from 'react';

/** Thin bar under the header showing how far through the page you've scrolled. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 'calc(var(--header-height) + env(safe-area-inset-top))',
        left: 0,
        height: 3,
        width: `${pct}%`,
        background: 'var(--accent)',
        zIndex: 19,
        transition: 'width 0.1s linear',
      }}
    />
  );
}

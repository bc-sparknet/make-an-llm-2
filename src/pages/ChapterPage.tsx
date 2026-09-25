import { Suspense, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { chapterComponents, findChapter } from '../chapters/registry';
import { mdxComponents } from '../components/content/mdxComponents';
import { ChapterContext } from '../components/content/ChapterContext';
import { ReadingProgress } from '../components/layout/ReadingProgress';
import { useChapterProgress } from '../lib/progress';
import { NotFoundPage } from './NotFoundPage';
import styles from './ChapterPage.module.css';

export function ChapterPage() {
  const { slug } = useParams();
  const { chapter, prev, next } = findChapter(slug);
  const [progress, update] = useChapterProgress(slug ?? '');

  useEffect(() => {
    if (chapter) document.title = `${chapter.number}. ${chapter.title} · Build an LLM`;
  }, [chapter]);

  if (!chapter) return <NotFoundPage />;
  const Content = chapterComponents[chapter.slug];

  return (
    <ChapterContext.Provider value={{ slug: chapter.slug }}>
      <ReadingProgress />
      <p className={styles.eyebrow}>Chapter {chapter.number}</p>
      <h1>{chapter.title}</h1>

      <article className={styles.article}>
        <Suspense fallback={<p className={styles.loading}>Loading chapter…</p>}>
          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </Suspense>
      </article>

      <div className={styles.complete}>
        <button
          className={styles.completeButton}
          data-done={!!progress.completed}
          onClick={() => update({ completed: !progress.completed })}
        >
          {progress.completed ? '✓ Chapter complete' : 'Mark chapter as complete'}
        </button>
      </div>

      <nav className={styles.pager} aria-label="Chapter navigation">
        {prev ? (
          <Link to={`/chapter/${prev.slug}`} className={styles.pagerLink}>
            <span className={styles.pagerLabel}>← Previous</span>
            <span>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/chapter/${next.slug}`} className={`${styles.pagerLink} ${styles.pagerNext}`}>
            <span className={styles.pagerLabel}>Next →</span>
            <span>{next.title}</span>
          </Link>
        ) : (
          <Link to="/" className={`${styles.pagerLink} ${styles.pagerNext}`}>
            <span className={styles.pagerLabel}>Finished!</span>
            <span>Back to all chapters</span>
          </Link>
        )}
      </nav>
    </ChapterContext.Provider>
  );
}

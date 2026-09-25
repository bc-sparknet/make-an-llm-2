import { Link } from 'react-router-dom';
import { chapters } from '../chapters/registry';
import { resetProgress, useProgress } from '../lib/progress';
import styles from './HomePage.module.css';

export function HomePage() {
  const progress = useProgress();
  const done = chapters.filter((c) => progress[c.slug]?.completed).length;
  const nextUp = chapters.find((c) => !progress[c.slug]?.completed) ?? chapters[0];

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>An interactive course</p>
        <h1>Build a Large Language Model, one idea at a time</h1>
        <p className={styles.lede}>
          Go from raw text to a working GPT-style model. Each chapter mixes short explanations, real PyTorch
          code, visualizations you can poke at, and a quick quiz to check your understanding.
        </p>
        <Link to={`/chapter/${nextUp.slug}`} className={styles.cta}>
          {done === 0 ? 'Start with Chapter 1' : `Continue: Chapter ${nextUp.number}`} →
        </Link>
        {done > 0 && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div style={{ width: `${(done / chapters.length) * 100}%` }} />
            </div>
            <span>
              {done} of {chapters.length} chapters complete
            </span>
          </div>
        )}
      </section>

      <ol className={styles.list}>
        {chapters.map((c) => {
          const p = progress[c.slug];
          return (
            <li key={c.slug}>
              <Link to={`/chapter/${c.slug}`} className={styles.card} data-done={!!p?.completed}>
                <span className={styles.cardNumber}>{p?.completed ? '✓' : c.number}</span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{c.title}</span>
                  <span className={styles.cardSummary}>{c.summary}</span>
                  <span className={styles.cardMeta}>
                    ~{c.minutes} min
                    {p?.quiz && ` · Quiz ${p.quiz.correct}/${p.quiz.total}`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <section className={styles.about}>
        <h2>How to use this site</h2>
        <p>
          The chapters build on each other, so reading in order works best. Code examples are PyTorch and are meant
          to be read alongside the explanation; you don&rsquo;t need to run them to follow along, but you can copy
          them into a notebook if you&rsquo;d like to.
        </p>
        <p>
          Your progress is saved in this browser only.{' '}
          {done > 0 && (
            <button className={styles.linkButton} onClick={() => confirm('Reset all progress?') && resetProgress()}>
              Reset progress
            </button>
          )}
        </p>
      </section>
    </>
  );
}

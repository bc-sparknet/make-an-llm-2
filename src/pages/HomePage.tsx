import { Link } from 'react-router-dom';
import { chaptersInTrack, trackInfo, type ChapterMeta, type Track } from '../chapters/registry';
import { resetProgress, useProgress, type ChapterProgress } from '../lib/progress';
import styles from './HomePage.module.css';

const mainChapters = chaptersInTrack('main');

export function HomePage() {
  const progress = useProgress();
  const done = mainChapters.filter((c) => progress[c.slug]?.completed).length;
  const nextUp = mainChapters.find((c) => !progress[c.slug]?.completed) ?? mainChapters[0];
  const anyProgress = Object.values(progress).some((p) => p.completed || p.quiz);

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
          {done === 0 ? 'Start with Chapter 1' : `Continue: Chapter ${nextUp.label}`} →
        </Link>
        {done > 0 && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div style={{ width: `${(done / mainChapters.length) * 100}%` }} />
            </div>
            <span>
              {done} of {mainChapters.length} chapters complete
            </span>
          </div>
        )}
      </section>

      <TrackSection track="main" progress={progress} />
      <TrackSection track="foundations" progress={progress} />

      <section className={styles.about}>
        <h2>How to use this site</h2>
        <p>
          The main chapters build on each other, so reading in order works best. If tensors and PyTorch are new to
          you, skim the Foundations chapters first, or come back to them whenever a shape or a <code>dim=</code>{' '}
          argument stops making sense.
        </p>
        <p>
          Code examples are PyTorch. Each chapter with code has a button to run it as a notebook in Google Colab.
        </p>
        <p>
          Your progress is saved in this browser only.{' '}
          {anyProgress && (
            <button className={styles.linkButton} onClick={() => confirm('Reset all progress?') && resetProgress()}>
              Reset progress
            </button>
          )}
        </p>
      </section>
    </>
  );
}

function TrackSection({ track, progress }: { track: Track; progress: Record<string, ChapterProgress> }) {
  return (
    <section className={styles.track}>
      <h2 className={styles.trackTitle}>{trackInfo[track].title}</h2>
      <p className={styles.trackDescription}>{trackInfo[track].description}</p>
      <ol className={styles.list}>
        {chaptersInTrack(track).map((c) => (
          <li key={c.slug}>
            <ChapterCard chapter={c} progress={progress[c.slug]} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChapterCard({ chapter: c, progress: p }: { chapter: ChapterMeta; progress?: ChapterProgress }) {
  return (
    <Link to={`/chapter/${c.slug}`} className={styles.card} data-done={!!p?.completed} data-track={c.track}>
      <span className={styles.cardNumber}>{p?.completed ? '✓' : c.label}</span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>{c.title}</span>
        <span className={styles.cardSummary}>{c.summary}</span>
        <span className={styles.cardMeta}>
          ~{c.minutes} min
          {p?.quiz && ` · Quiz ${p.quiz.correct}/${p.quiz.total}`}
        </span>
      </span>
    </Link>
  );
}

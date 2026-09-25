import { useState } from 'react';
import { useChapter } from './ChapterContext';
import { useChapterProgress } from '../../lib/progress';
import { InlineMarkdown } from './InlineMarkdown';
import styles from './Quiz.module.css';

export interface QuizQuestion {
  /** The question. Supports `inline code` and **bold**. */
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
  /** Shown after answering, whether right or wrong. */
  explanation: string;
}

interface Props {
  questions: QuizQuestion[];
  title?: string;
}

/**
 * A multiple-choice quiz. Each answer is checked immediately with an
 * explanation; the final score is saved to the learner's chapter progress.
 */
export function Quiz({ questions, title = 'Check your understanding' }: Props) {
  const { slug } = useChapter();
  const [, updateProgress] = useChapterProgress(slug);
  const [choices, setChoices] = useState<(number | null)[]>(() => questions.map(() => null));

  const answered = choices.filter((c) => c !== null).length;
  const correct = choices.filter((c, i) => c === questions[i].answer).length;
  const finished = answered === questions.length;

  const choose = (qi: number, oi: number) => {
    if (choices[qi] !== null) return;
    const next = choices.map((c, i) => (i === qi ? oi : c));
    setChoices(next);
    if (next.every((c) => c !== null)) {
      const score = next.filter((c, i) => c === questions[i].answer).length;
      updateProgress({ quiz: { correct: score, total: questions.length } });
    }
  };

  return (
    <section className={styles.quiz} aria-label={title}>
      <header className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.score}>
          {answered}/{questions.length} answered
        </span>
      </header>

      {questions.map((q, qi) => {
        const choice = choices[qi];
        return (
          <fieldset key={qi} className={styles.question}>
            <legend className={styles.prompt}>
              <span className={styles.qNumber}>{qi + 1}.</span> <InlineMarkdown text={q.prompt} />
            </legend>
            <div className={styles.options}>
              {q.options.map((opt, oi) => {
                const state =
                  choice === null ? 'idle' : oi === q.answer ? 'correct' : oi === choice ? 'wrong' : 'dim';
                return (
                  <button
                    key={oi}
                    className={styles.option}
                    data-state={state}
                    disabled={choice !== null}
                    onClick={() => choose(qi, oi)}
                    aria-pressed={choice === oi}
                  >
                    <span className={styles.marker} aria-hidden="true">
                      {state === 'correct' ? '✓' : state === 'wrong' ? '✗' : String.fromCharCode(65 + oi)}
                    </span>
                    <span>
                      <InlineMarkdown text={opt} />
                    </span>
                  </button>
                );
              })}
            </div>
            {choice !== null && (
              <p className={styles.explanation} data-correct={choice === q.answer} role="status">
                <strong>{choice === q.answer ? 'Correct. ' : 'Not quite. '}</strong>
                <InlineMarkdown text={q.explanation} />
              </p>
            )}
          </fieldset>
        );
      })}

      {finished && (
        <footer className={styles.footer}>
          <span>
            You got <strong>{correct}</strong> of {questions.length}.
            {correct === questions.length ? ' Perfect!' : ''}
          </span>
          <button className={styles.retry} onClick={() => setChoices(questions.map(() => null))}>
            Try again
          </button>
        </footer>
      )}
    </section>
  );
}

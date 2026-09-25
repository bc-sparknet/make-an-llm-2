import { useState } from 'react';
import { Figure, ProbabilityBars } from '../../components';
import styles from './NextWordGame.module.css';

/**
 * "Be the language model": the learner guesses the next word, then sees a
 * (hand-written, illustrative) probability distribution like a model's.
 */

interface Round {
  context: string;
  candidates: { word: string; p: number }[];
}

const ROUNDS: Round[] = [
  {
    context: 'The cat sat on the',
    candidates: [
      { word: 'mat', p: 0.41 },
      { word: 'floor', p: 0.18 },
      { word: 'sofa', p: 0.14 },
      { word: 'roof', p: 0.09 },
      { word: 'keyboard', p: 0.05 },
    ],
  },
  {
    context: 'To be, or not to',
    candidates: [
      { word: 'be', p: 0.93 },
      { word: 'do', p: 0.02 },
      { word: 'go', p: 0.01 },
      { word: 'say', p: 0.01 },
      { word: 'see', p: 0.005 },
    ],
  },
  {
    context: 'I went to the store to buy some',
    candidates: [
      { word: 'milk', p: 0.16 },
      { word: 'food', p: 0.12 },
      { word: 'groceries', p: 0.1 },
      { word: 'bread', p: 0.09 },
      { word: 'new', p: 0.06 },
    ],
  },
];

export function NextWordGame() {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const r = ROUNDS[round];

  // Show options in a stable shuffled order so the top answer isn't always first.
  const order = [...r.candidates.keys()].sort((a, b) => ((a * 7 + round) % 5) - ((b * 7 + round) % 5));

  return (
    <Figure
      title="Be the language model"
      caption="Probabilities are illustrative. Notice that some contexts have one obvious answer while others leave many plausible options; a real model outputs a probability for every token in its vocabulary."
    >
      <p className={styles.context}>
        “{r.context} <span className={styles.blank}>{guess === null ? '____' : r.candidates[guess].word}</span>”
      </p>

      {guess === null ? (
        <div className={styles.options}>
          {order.map((i) => (
            <button key={i} className={styles.option} onClick={() => setGuess(i)}>
              {r.candidates[i].word}
            </button>
          ))}
        </div>
      ) : (
        <>
          <ProbabilityBars
            labels={r.candidates.map((c) => c.word)}
            values={r.candidates.map((c) => c.p)}
            highlight={guess}
          />
          <p className={styles.verdict}>
            {guess === 0
              ? 'You picked the most likely word, just like greedy decoding would.'
              : `A model would rate “${r.candidates[guess].word}” as less likely than “${r.candidates[0].word}”, but still possible.`}
          </p>
          <button
            className={styles.next}
            onClick={() => {
              setGuess(null);
              setRound((round + 1) % ROUNDS.length);
            }}
          >
            Next sentence →
          </button>
        </>
      )}
    </Figure>
  );
}

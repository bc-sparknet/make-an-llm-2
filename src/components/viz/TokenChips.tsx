import type { CSSProperties } from 'react';
import styles from './viz.module.css';

interface Props {
  tokens: string[];
  /** Optional number shown under each token (e.g. its ID). */
  ids?: number[];
  highlight?: number[];
  /** Dimmed tokens (e.g. outside the current window). */
  dim?: number[];
  onTokenClick?: (index: number) => void;
  selected?: number;
}

const PALETTE = ['#e9b8a2', '#a9c7ea', '#b5dcc2', '#d6c1ec', '#f0d596', '#f1b5c6'];

/** Tokens rendered as coloured chips; colour cycles so boundaries are obvious. */
export function TokenChips({ tokens, ids, highlight = [], dim = [], onTokenClick, selected }: Props) {
  return (
    <div className={styles.chips}>
      {tokens.map((t, i) => {
        const Tag = onTokenClick ? 'button' : 'span';
        return (
          <Tag
            key={i}
            className={styles.chip}
            data-highlight={highlight.includes(i)}
            data-dim={dim.includes(i)}
            data-selected={selected === i}
            style={{ '--chip': PALETTE[i % PALETTE.length] } as CSSProperties}
            onClick={onTokenClick ? () => onTokenClick(i) : undefined}
          >
            <span className={styles.chipText}>{t.replace(/ /g, '·') || '∅'}</span>
            {ids && <span className={styles.chipId}>{ids[i]}</span>}
          </Tag>
        );
      })}
    </div>
  );
}

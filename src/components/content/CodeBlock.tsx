import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import styles from './CodeBlock.module.css';

interface Props {
  code: string;
  language?: string;
  /** Optional caption shown above the code, e.g. a file name. */
  title?: string;
}

export function CodeBlock({ code, language = 'python', title }: Props) {
  const [copied, setCopied] = useState(false);
  const trimmed = code.replace(/\n$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — nothing useful to do */
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span>{title ?? language}</span>
        <button onClick={copy} className={styles.copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Two themes rendered via CSS so it follows light/dark without re-rendering. */}
      <Highlight code={trimmed} language={language} theme={themes.github}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className={styles.pre}>
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} style={undefined}>
                  {line.map((token, key) => {
                    const props = getTokenProps({ token });
                    return <span key={key} className={`${props.className} ${styles.token}`} children={props.children} />;
                  })}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}

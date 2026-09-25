import type { MDXComponents } from 'mdx/types';
import type { ReactElement } from 'react';
import { CodeBlock } from './CodeBlock';

/**
 * Maps plain Markdown elements to our components. Fenced code blocks in MDX
 * arrive as <pre><code className="language-xyz">…</code></pre>.
 */
export const mdxComponents: MDXComponents = {
  pre: ({ children }) => {
    const code = children as ReactElement<{ className?: string; children?: string }>;
    const language = code.props.className?.replace('language-', '') ?? 'text';
    return <CodeBlock code={String(code.props.children ?? '')} language={language} />;
  },
};

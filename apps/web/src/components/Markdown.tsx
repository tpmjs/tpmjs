'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// eslint-disable-next-line import/no-internal-modules
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Markdown renderer component
 * Safely renders markdown content with GitHub Flavored Markdown support
 * Styled with theme-aware semantic tokens for proper light/dark mode support
 */
export function Markdown({ content, className = '' }: MarkdownProps): React.ReactElement {
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none prose-lg
        prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b prose-h1:border-border
        prose-h2:text-3xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
        prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8
        prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6
        prose-p:text-base prose-p:leading-relaxed prose-p:mb-4 prose-p:text-foreground-secondary
        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:transition-colors
        prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent prose-pre:border-0
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400 prose-blockquote:pl-5 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-foreground-secondary prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:my-6 prose-blockquote:rounded-r
        prose-ul:list-disc prose-ul:pl-6 prose-ul:my-5 prose-ul:space-y-2
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-5 prose-ol:space-y-2
        prose-li:text-base prose-li:leading-relaxed prose-li:text-foreground-secondary
        prose-img:rounded-lg prose-img:shadow-lg prose-img:my-8 prose-img:border prose-img:border-border
        prose-hr:border-border prose-hr:my-10
        prose-strong:font-semibold prose-strong:text-foreground
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom component for code blocks with syntax highlighting
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  className="bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono font-semibold border border-pink-200 dark:border-pink-900"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                language={language || 'text'}
                // @ts-expect-error - Type conflict between solarizedlight theme and SyntaxHighlighter props
                style={solarizedlight}
                customStyle={{
                  margin: '0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  padding: '1rem',
                }}
                wrapLongLines={true}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
          // Pre wrapper for code blocks (SyntaxHighlighter handles its own styling)
          pre: ({ children, ...props }) => {
            return (
              <div className="my-6 overflow-hidden rounded-lg shadow-md border border-border">
                <pre {...props}>{children}</pre>
              </div>
            );
          },
          // Make links open in new tab with better styling
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Better table styling with improved readability
          table: ({ children, ...props }) => {
            return (
              <div className="overflow-x-auto my-8 rounded-lg border border-border shadow-sm">
                <table className="min-w-full divide-y divide-border" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          // Table header with better styling
          thead: ({ children, ...props }) => {
            return (
              <thead className="bg-surface-secondary" {...props}>
                {children}
              </thead>
            );
          },
          // Table header cells with better spacing
          th: ({ children, ...props }) => {
            return (
              <th
                className="px-6 py-3 text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider"
                {...props}
              >
                {children}
              </th>
            );
          },
          // Table data cells with better spacing
          td: ({ children, ...props }) => {
            return (
              <td className="px-6 py-4 text-sm text-foreground" {...props}>
                {children}
              </td>
            );
          },
          // Table rows with hover effect
          tr: ({ children, ...props }) => {
            return (
              <tr
                className="border-b border-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors"
                {...props}
              >
                {children}
              </tr>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

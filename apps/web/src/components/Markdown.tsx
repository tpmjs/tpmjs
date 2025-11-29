'use client';

import ReactMarkdown from 'react-markdown';
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
 * Styled to match npm.com's beautiful README rendering
 */
export function Markdown({ content, className = '' }: MarkdownProps): React.ReactElement {
  return (
    <div
      className={`prose prose-slate dark:prose-invert max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b prose-h1:border-border
        prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
        prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6
        prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-5
        prose-p:text-base prose-p:leading-7 prose-p:mb-4
        prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
        prose-code:text-sm prose-code:font-mono prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:before:content-none prose-code:after:content-none prose-code:font-semibold
        prose-pre:bg-zinc-50 dark:prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:shadow-sm
        prose-pre:my-5
        prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-400 prose-blockquote:bg-zinc-50 dark:prose-blockquote:bg-zinc-900/50 prose-blockquote:my-4
        prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:space-y-2
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:space-y-2
        prose-li:text-base prose-li:leading-7
        prose-table:border-collapse prose-table:w-full prose-table:my-6 prose-table:text-sm
        prose-thead:bg-zinc-50 dark:prose-thead:bg-zinc-800/50
        prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold
        prose-td:border prose-td:border-zinc-300 dark:prose-td:border-zinc-700 prose-td:px-4 prose-td:py-3
        prose-tr:border-b prose-tr:border-zinc-200 dark:prose-tr:border-zinc-800
        prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6
        prose-hr:border-zinc-300 dark:prose-hr:border-zinc-700 prose-hr:my-8
        prose-strong:font-semibold
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom component for code blocks with better styling
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-zinc-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Better styled pre blocks
          pre: ({ children, ...props }) => {
            return (
              <pre
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 overflow-x-auto my-5 shadow-sm"
                {...props}
              >
                {children}
              </pre>
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
          // Better table styling
          table: ({ children, ...props }) => {
            return (
              <div className="overflow-x-auto my-6">
                <table
                  className="min-w-full divide-y divide-zinc-300 dark:divide-zinc-700 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

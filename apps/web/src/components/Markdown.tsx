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
 */
export function Markdown({ content, className = '' }: MarkdownProps): React.ReactElement {
  return (
    <div
      className={`prose prose-invert max-w-none
        prose-headings:text-foreground prose-headings:font-bold
        prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
        prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
        prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
        prose-p:text-foreground-secondary prose-p:leading-relaxed
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-code:text-foreground prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
        prose-pre:text-foreground-secondary
        prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground-secondary
        prose-ul:text-foreground-secondary prose-ul:list-disc prose-ul:pl-6
        prose-ol:text-foreground-secondary prose-ol:list-decimal prose-ol:pl-6
        prose-li:my-1
        prose-table:border-collapse prose-table:w-full
        prose-thead:bg-surface
        prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
        prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground-secondary
        prose-img:rounded-lg prose-img:shadow-md
        prose-hr:border-border prose-hr:my-8
        prose-strong:text-foreground prose-strong:font-semibold
        prose-em:text-foreground-secondary
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Custom component for code blocks to match the site's theme
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-surface px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
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
          // Make links open in new tab
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-primary hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

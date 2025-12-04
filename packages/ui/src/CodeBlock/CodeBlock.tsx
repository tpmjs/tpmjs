import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Icon } from '../Icon/Icon';
import type { CodeBlockProps } from './types';
import {
  codeBlockCodeVariants,
  codeBlockContainerVariants,
  codeBlockCopyButtonVariants,
} from './variants';

/**
 * CodeBlock component
 *
 * Displays formatted code with syntax highlighting and optional copy functionality.
 * Uses Prism syntax highlighter for beautiful code display.
 * Built with React and JSX.
 *
 * @example
 * ```typescript
 * import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
 *
 * function MyComponent() {
 *   return (
 *     <CodeBlock
 *       code="npm install @tpmjs/registry"
 *       language="bash"
 *       size="md"
 *       showCopy={true}
 *     />
 *   );
 * }
 * ```
 */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    { className, code, language = 'text', size = 'md', showCopy = true, theme = 'light', ...props },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Silently fail if clipboard API is not available
        console.error('Failed to copy code:', err);
      }
    };

    // Map language aliases to supported languages
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      py: 'python',
      rb: 'ruby',
      sh: 'bash',
      yml: 'yaml',
    };

    const normalizedLanguage = languageMap[language] || language;

    return (
      <div ref={ref} className={cn(codeBlockContainerVariants(), className)} {...props}>
        <div className={codeBlockCodeVariants({ size })} data-language={normalizedLanguage}>
          <SyntaxHighlighter
            language={normalizedLanguage}
            style={theme === 'dark' ? vscDarkPlus : prism}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: 'inherit',
              lineHeight: 'inherit',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'inherit',
                color: '#24292e', // Darker text color for better contrast
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
        {showCopy && (
          <button
            type="button"
            className={codeBlockCopyButtonVariants()}
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy code'}
            data-testid="copy-button"
          >
            <Icon icon={copied ? 'check' : 'copy'} size="sm" />
          </button>
        )}
      </div>
    );
  }
);

CodeBlock.displayName = 'CodeBlock';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Icon } from '../Icon/Icon';
import type { CodeBlockProps } from './types';
import {
  codeBlockCodeVariants,
  codeBlockContainerVariants,
  codeBlockCopyButtonVariants,
} from './variants';

// Custom light theme with better contrast
const customLightTheme = {
  'code[class*="language-"]': {
    color: '#24292e',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '1em',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#24292e',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    fontSize: '1em',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
    padding: '1em',
    margin: '0.5em 0',
    overflow: 'auto',
  },
  comment: { color: '#6a737d', fontStyle: 'italic' },
  prolog: { color: '#6a737d' },
  doctype: { color: '#6a737d' },
  cdata: { color: '#6a737d' },
  punctuation: { color: '#24292e' },
  property: { color: '#005cc5' },
  tag: { color: '#22863a' },
  boolean: { color: '#005cc5' },
  number: { color: '#005cc5' },
  constant: { color: '#005cc5' },
  symbol: { color: '#005cc5' },
  deleted: { color: '#b31d28' },
  selector: { color: '#22863a' },
  'attr-name': { color: '#6f42c1' },
  string: { color: '#032f62' },
  char: { color: '#032f62' },
  builtin: { color: '#005cc5' },
  inserted: { color: '#22863a' },
  operator: { color: '#d73a49' },
  entity: { color: '#6f42c1' },
  url: { color: '#032f62' },
  variable: { color: '#e36209' },
  atrule: { color: '#d73a49' },
  'attr-value': { color: '#032f62' },
  function: { color: '#6f42c1' },
  'class-name': { color: '#6f42c1' },
  keyword: { color: '#d73a49' },
  regex: { color: '#032f62' },
  important: { color: '#d73a49', fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

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
            style={theme === 'dark' ? oneDark : oneLight}
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

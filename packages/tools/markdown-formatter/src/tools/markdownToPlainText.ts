import { tool } from 'ai';
import { z } from 'zod';

const MarkdownToPlainTextSchema = z.object({
  markdown: z
    .string()
    .min(1, 'Markdown text cannot be empty')
    .describe('The markdown text to convert to plain text'),
  preserveLineBreaks: z
    .boolean()
    .default(true)
    .describe('Whether to preserve line breaks in the output'),
});

export const markdownToPlainText = tool({
  description: 'Convert markdown to plain text by removing all formatting',
  inputSchema: MarkdownToPlainTextSchema,
  async execute(input: z.infer<typeof MarkdownToPlainTextSchema>) {
    const { markdown, preserveLineBreaks } = input;

    // Defensive check: Validate required parameters
    if (!markdown || markdown.trim().length === 0) {
      return {
        success: false,
        error: 'Missing required parameter: markdown',
        plainText: '',
        originalLength: 0,
        plainTextLength: 0,
      };
    }

    // Remove markdown formatting
    let plainText = markdown;

    // Remove headers (# ## ###)
    plainText = plainText.replace(/^#{1,6}\s+/gm, '');

    // Remove bold and italic (**bold**, *italic*, __bold__, _italic_)
    plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2');
    plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove links [text](url) -> text
    plainText = plainText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Remove images ![alt](url) -> alt
    plainText = plainText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

    // Remove inline code `code`
    plainText = plainText.replace(/`([^`]+)`/g, '$1');

    // Remove code blocks ```code```
    plainText = plainText.replace(/```[\s\S]*?```/g, '');

    // Remove horizontal rules (---, ***)
    plainText = plainText.replace(/^[\*\-_]{3,}$/gm, '');

    // Remove blockquotes (>)
    plainText = plainText.replace(/^>\s*/gm, '');

    // Remove list markers (-, *, +, 1.)
    plainText = plainText.replace(/^[\s]*[-\*\+]\s+/gm, '');
    plainText = plainText.replace(/^[\s]*\d+\.\s+/gm, '');

    // Handle line breaks
    if (!preserveLineBreaks) {
      plainText = plainText.replace(/\n+/g, ' ');
    }

    // Clean up extra whitespace
    plainText = plainText.replace(/\s+/g, ' ').trim();

    return {
      success: true,
      plainText,
      originalLength: markdown.length,
      plainTextLength: plainText.length,
      reductionPercent: Math.round(((markdown.length - plainText.length) / markdown.length) * 100),
    };
  },
});

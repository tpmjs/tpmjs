/**
 * HTML Sanitize Tool for TPMJS
 * Sanitizes HTML to prevent XSS attacks using isomorphic-dompurify
 *
 * @requires Node.js 18+
 */

import { jsonSchema, tool } from 'ai';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Options for HTML sanitization
 */
export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

/**
 * Input for HTML sanitization
 */
type HtmlSanitizeInput = {
  html: string;
  options?: SanitizeOptions;
};

/**
 * Output interface for HTML sanitization
 */
export interface HtmlSanitizeResult {
  sanitized: string;
  removedCount: number;
  warnings: string[];
}

/**
 * Default safe tags for HTML sanitization
 */
const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
  'code',
  'pre',
];

/**
 * Default safe attributes for HTML sanitization
 */
const DEFAULT_ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class', 'id'],
};

/**
 * Count removed elements by comparing original and sanitized HTML
 */
function countRemovedElements(original: string, sanitized: string): number {
  const originalTagCount = (original.match(/<[^>]+>/g) || []).length;
  const sanitizedTagCount = (sanitized.match(/<[^>]+>/g) || []).length;
  return Math.max(0, originalTagCount - sanitizedTagCount);
}

/**
 * Generate warnings about potentially dangerous content
 */
function generateWarnings(html: string, sanitized: string): string[] {
  const warnings: string[] = [];

  // Check for script tags
  if (/<script/i.test(html) && !/<script/i.test(sanitized)) {
    warnings.push('Removed script tags to prevent XSS');
  }

  // Check for inline event handlers
  if (/on\w+\s*=/i.test(html) && !/on\w+\s*=/i.test(sanitized)) {
    warnings.push('Removed inline event handlers (onclick, onerror, etc.)');
  }

  // Check for iframe tags
  if (/<iframe/i.test(html) && !/<iframe/i.test(sanitized)) {
    warnings.push('Removed iframe tags');
  }

  // Check for object/embed tags
  if (/<(object|embed)/i.test(html) && !/<(object|embed)/i.test(sanitized)) {
    warnings.push('Removed object or embed tags');
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(html) && !/javascript:/i.test(sanitized)) {
    warnings.push('Removed javascript: protocol from links');
  }

  // Check for data: protocol in non-image contexts
  if (/data:(?!image)/i.test(html) && !/data:(?!image)/i.test(sanitized)) {
    warnings.push('Removed potentially unsafe data: URLs');
  }

  // Check for style tags
  if (/<style/i.test(html) && !/<style/i.test(sanitized)) {
    warnings.push('Removed style tags');
  }

  return warnings;
}

/**
 * HTML Sanitize Tool
 * Sanitizes HTML to prevent XSS attacks with customizable allowed tags and attributes
 */
export const htmlSanitizeTool = tool({
  description:
    'Sanitize HTML content to prevent XSS (Cross-Site Scripting) attacks. Removes dangerous tags, attributes, and protocols while preserving safe HTML structure. Supports custom allowed tags and attributes configuration.',
  inputSchema: jsonSchema<HtmlSanitizeInput>({
    type: 'object',
    properties: {
      html: {
        type: 'string',
        description: 'The HTML string to sanitize',
      },
      options: {
        type: 'object',
        description: 'Optional configuration for allowed tags and attributes',
        properties: {
          allowedTags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of allowed HTML tag names (e.g., ["p", "a", "strong"])',
          },
          allowedAttributes: {
            type: 'object',
            description: 'Object mapping tag names to arrays of allowed attributes',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    required: ['html'],
    additionalProperties: false,
  }),
  async execute({ html, options }): Promise<HtmlSanitizeResult> {
    // Validate input
    if (typeof html !== 'string') {
      throw new Error('HTML input must be a string');
    }

    const allowedTags = options?.allowedTags || DEFAULT_ALLOWED_TAGS;
    const allowedAttributes = options?.allowedAttributes || DEFAULT_ALLOWED_ATTRS;

    // Build DOMPurify configuration
    const config: {
      ALLOWED_TAGS: string[];
      ALLOWED_ATTR: string[];
    } = {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: [],
    };

    // Flatten allowed attributes
    for (const [, attrs] of Object.entries(allowedAttributes)) {
      config.ALLOWED_ATTR.push(...attrs);
    }

    // Remove duplicates
    config.ALLOWED_ATTR = [...new Set(config.ALLOWED_ATTR)];

    // Sanitize the HTML
    const sanitized = DOMPurify.sanitize(html, config);

    // Count removed elements
    const removedCount = countRemovedElements(html, sanitized);

    // Generate warnings
    const warnings = generateWarnings(html, sanitized);

    return {
      sanitized,
      removedCount,
      warnings,
    };
  },
});

export default htmlSanitizeTool;

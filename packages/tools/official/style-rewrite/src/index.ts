/**
 * Style Rewrite Tool for TPMJS
 * Rewrites text to match a style guide using find/replace rules.
 * Supports both simple string replacement and regex patterns.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Style rule with find/replace
 */
export interface StyleRule {
  find?: string;
  replace?: string;
  pattern?: string;
  replacement?: string;
}

/**
 * Change record showing what was modified
 */
export interface ChangeApplied {
  rule: string;
  matches: number;
  preview: string;
}

/**
 * Output interface for style rewrite
 */
export interface StyleRewriteResult {
  rewritten: string;
  changesApplied: ChangeApplied[];
  originalLength: number;
  newLength: number;
}

type StyleRewriteInput = {
  text: string;
  rules: StyleRule[];
};

/**
 * Applies a single style rule to text
 */
function applyRule(
  text: string,
  rule: StyleRule
): { text: string; matches: number; preview: string } {
  let result = text;
  let matches = 0;
  let preview = '';

  // Regex pattern mode
  if (rule.pattern && rule.replacement !== undefined) {
    try {
      const regex = new RegExp(rule.pattern, 'g');
      const originalMatches = text.match(regex);
      if (originalMatches) {
        matches = originalMatches.length;
        preview = originalMatches[0] || '';
      }
      result = text.replace(regex, rule.replacement);
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${rule.pattern}`);
    }
  }
  // Simple find/replace mode
  else if (rule.find !== undefined && rule.replace !== undefined) {
    const parts = text.split(rule.find);
    matches = parts.length - 1;
    if (matches > 0) {
      preview = rule.find;
      result = parts.join(rule.replace);
    }
  } else {
    throw new Error('Rule must have either (find, replace) or (pattern, replacement)');
  }

  return { text: result, matches, preview };
}

/**
 * Style Rewrite Tool
 * Rewrites text according to a set of style rules
 */
export const styleRewriteTool = tool({
  description:
    'Rewrites text to match a style guide using find/replace rules. Supports simple string replacement with find/replace or advanced regex patterns with pattern/replacement. Returns the rewritten text along with details about what changed.',
  inputSchema: jsonSchema<StyleRewriteInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to rewrite according to the style guide',
      },
      rules: {
        type: 'array',
        description:
          'Array of style rules. Each rule can use find/replace for simple text replacement or pattern/replacement for regex-based replacement.',
        items: {
          type: 'object',
          properties: {
            find: {
              type: 'string',
              description: 'String to find (for simple replacement)',
            },
            replace: {
              type: 'string',
              description: 'String to replace with (for simple replacement)',
            },
            pattern: {
              type: 'string',
              description: 'Regex pattern to match (for advanced replacement)',
            },
            replacement: {
              type: 'string',
              description: 'Replacement string for regex matches',
            },
          },
        },
      },
    },
    required: ['text', 'rules'],
    additionalProperties: false,
  }),
  async execute({ text, rules }): Promise<StyleRewriteResult> {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new Error('text is required and must be a string');
    }

    if (!Array.isArray(rules) || rules.length === 0) {
      throw new Error('rules is required and must be a non-empty array');
    }

    const originalLength = text.length;
    let currentText = text;
    const changesApplied: ChangeApplied[] = [];

    // Apply each rule in sequence
    for (const rule of rules) {
      const { text: newText, matches, preview } = applyRule(currentText, rule);

      if (matches > 0) {
        const ruleDescription = rule.pattern
          ? `Pattern: ${rule.pattern} → ${rule.replacement}`
          : `Find: "${rule.find}" → Replace: "${rule.replace}"`;

        changesApplied.push({
          rule: ruleDescription,
          matches,
          preview: preview.length > 50 ? `${preview.substring(0, 50)}...` : preview,
        });

        currentText = newText;
      }
    }

    return {
      rewritten: currentText,
      changesApplied,
      originalLength,
      newLength: currentText.length,
    };
  },
});

export default styleRewriteTool;

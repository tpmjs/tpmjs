/**
 * Redact Secrets Tool for TPMJS
 * Redacts detected secrets from text by replacing them with [REDACTED:type] placeholders
 *
 * Uses the same patterns as secret-scan-text but replaces matches instead of reporting them
 */

import { jsonSchema, tool } from 'ai';

export interface Redaction {
  type: string;
  originalLength: number;
  line: number;
  column: number;
  replacement: string;
}

export interface RedactionResult {
  redacted: string;
  redactionCount: number;
  redactions: Redaction[];
  metadata: {
    originalLength: number;
    redactedLength: number;
    linesProcessed: number;
  };
}

type RedactSecretsInput = {
  text: string;
  customPatterns?: string[];
};

/**
 * Secret detection patterns - same as secret-scan-text
 */
const SECRET_PATTERNS: Array<{
  type: string;
  pattern: RegExp;
  description: string;
}> = [
  // AWS Credentials
  {
    type: 'aws-access-key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    description: 'AWS Access Key ID',
  },
  {
    type: 'aws-secret-key',
    pattern: /aws(.{0,20})?['\"][0-9a-zA-Z/+]{40}['\"]/gi,
    description: 'AWS Secret Access Key',
  },
  {
    type: 'aws-account-id',
    pattern: /aws(.{0,20})?['\"]?[0-9]{12}['\"]?/gi,
    description: 'AWS Account ID',
  },

  // GitHub
  {
    type: 'github-token',
    pattern: /gh[pousr]_[0-9a-zA-Z]{36}/g,
    description: 'GitHub Personal Access Token',
  },
  {
    type: 'github-oauth',
    pattern: /gho_[0-9a-zA-Z]{36}/g,
    description: 'GitHub OAuth Token',
  },

  // Slack
  {
    type: 'slack-token',
    pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    description: 'Slack Token',
  },
  {
    type: 'slack-webhook',
    pattern:
      /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
    description: 'Slack Webhook URL',
  },

  // OpenAI
  {
    type: 'openai-api-key',
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    description: 'OpenAI API Key',
  },

  // Stripe
  {
    type: 'stripe-api-key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    description: 'Stripe Live API Key',
  },
  {
    type: 'stripe-restricted-key',
    pattern: /rk_live_[0-9a-zA-Z]{24,}/g,
    description: 'Stripe Restricted Key',
  },

  // Generic API Keys
  {
    type: 'generic-api-key',
    pattern: /api[_-]?key['\"]?\s*[:=]\s*['\"]?[0-9a-zA-Z_\-]{20,}['\"]?/gi,
    description: 'Generic API Key',
  },
  {
    type: 'generic-secret',
    pattern: /secret['\"]?\s*[:=]\s*['\"]?[0-9a-zA-Z_\-]{20,}['\"]?/gi,
    description: 'Generic Secret',
  },

  // JWT Tokens
  {
    type: 'jwt-token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    description: 'JWT Token',
  },

  // Private Keys
  {
    type: 'private-key',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
    description: 'Private Key',
  },

  // Database Connection Strings
  {
    type: 'postgres-connection',
    pattern:
      /postgres(ql)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_\-@$!%*?&]+@[a-zA-Z0-9._-]+(:[0-9]+)?\/[a-zA-Z0-9_-]+/gi,
    description: 'PostgreSQL Connection String',
  },
  {
    type: 'mysql-connection',
    pattern:
      /mysql:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_\-@$!%*?&]+@[a-zA-Z0-9._-]+(:[0-9]+)?\/[a-zA-Z0-9_-]+/gi,
    description: 'MySQL Connection String',
  },
  {
    type: 'mongodb-connection',
    pattern:
      /mongodb(\+srv)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_\-@$!%*?&]+@[a-zA-Z0-9._-]+(:[0-9]+)?\/[a-zA-Z0-9_-]+/gi,
    description: 'MongoDB Connection String',
  },

  // Generic Passwords in Code
  {
    type: 'hardcoded-password',
    pattern: /password['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"](?!\s*=)/gi,
    description: 'Hardcoded Password',
  },

  // Google API Keys
  {
    type: 'google-api-key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    description: 'Google API Key',
  },

  // Twilio
  {
    type: 'twilio-api-key',
    pattern: /SK[0-9a-fA-F]{32}/g,
    description: 'Twilio API Key',
  },

  // SendGrid
  {
    type: 'sendgrid-api-key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    description: 'SendGrid API Key',
  },

  // Mailchimp
  {
    type: 'mailchimp-api-key',
    pattern: /[0-9a-f]{32}-us[0-9]{1,2}/g,
    description: 'Mailchimp API Key',
  },

  // Generic Bearer Tokens
  {
    type: 'bearer-token',
    pattern: /bearer\s+[a-zA-Z0-9_\-\.=]{20,}/gi,
    description: 'Bearer Token',
  },

  // SSH Private Keys (DSA/RSA/ECDSA/ED25519)
  {
    type: 'ssh-private-key',
    pattern:
      /-----BEGIN (DSA|RSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (DSA|RSA|EC|OPENSSH) PRIVATE KEY-----/g,
    description: 'SSH Private Key',
  },
];

/**
 * Get line and column number from text position
 */
function getLineAndColumn(text: string, index: number): { line: number; column: number } {
  const lines = text.substring(0, index).split('\n');
  const lastLine = lines[lines.length - 1];
  return {
    line: lines.length,
    column: (lastLine?.length ?? 0) + 1,
  };
}

/**
 * Convert a string pattern to RegExp, handling invalid patterns
 */
function parseCustomPattern(pattern: string): RegExp | null {
  try {
    // If pattern looks like /pattern/flags, parse it
    const match = pattern.match(/^\/(.+?)\/([gimuy]*)$/);
    if (match?.[1]) {
      return new RegExp(match[1], match[2] || '');
    }
    // Otherwise treat as a literal pattern with global flag
    return new RegExp(pattern, 'g');
  } catch (error) {
    console.warn(`Invalid custom pattern: ${pattern}`, error);
    return null;
  }
}

/**
 * Redact secrets from text
 */
export const redactSecrets = tool({
  description:
    'Redact detected secrets from text by replacing them with [REDACTED:type] placeholders. Automatically detects API keys, tokens, passwords, and other sensitive data. Optionally provide custom regex patterns to redact.',
  inputSchema: jsonSchema<RedactSecretsInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to redact secrets from',
      },
      customPatterns: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional array of custom regex patterns to redact (as strings, e.g., "/pattern/g" or "pattern")',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text, customPatterns }): Promise<RedactionResult> {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    const originalLength = text.length;
    const originalLines = text.split('\n').length;
    const redactions: Redaction[] = [];

    // Collect all matches first (to avoid index shifting issues)
    const matches: Array<{
      type: string;
      start: number;
      end: number;
      value: string;
    }> = [];

    // Scan with built-in patterns
    for (const { type, pattern } of SECRET_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex pattern for exec loop
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          type,
          start: match.index,
          end: match.index + match[0].length,
          value: match[0],
        });
      }
    }

    // Add custom pattern matches
    if (customPatterns && Array.isArray(customPatterns)) {
      for (const patternStr of customPatterns) {
        const pattern = parseCustomPattern(patternStr);
        if (!pattern) continue;

        let match: RegExpExecArray | null;
        // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex pattern for exec loop
        while ((match = pattern.exec(text)) !== null) {
          matches.push({
            type: 'custom-pattern',
            start: match.index,
            end: match.index + match[0].length,
            value: match[0],
          });
        }
      }
    }

    // Sort matches by start position (reverse order for replacement)
    matches.sort((a, b) => b.start - a.start);

    // Remove overlapping matches (keep first occurrence)
    const uniqueMatches: typeof matches = [];
    for (const match of matches) {
      const overlaps = uniqueMatches.some(
        (m) =>
          (match.start >= m.start && match.start < m.end) ||
          (match.end > m.start && match.end <= m.end)
      );
      if (!overlaps) {
        uniqueMatches.push(match);
      }
    }

    // Perform redactions (from end to start to preserve indices)
    let redactedText = text;
    for (const match of uniqueMatches) {
      const replacement = `[REDACTED:${match.type}]`;
      const { line, column } = getLineAndColumn(text, match.start);

      redactions.push({
        type: match.type,
        originalLength: match.value.length,
        line,
        column,
        replacement,
      });

      redactedText =
        redactedText.substring(0, match.start) + replacement + redactedText.substring(match.end);
    }

    // Sort redactions by line number for output
    redactions.sort((a, b) => a.line - b.line);

    return {
      redacted: redactedText,
      redactionCount: redactions.length,
      redactions,
      metadata: {
        originalLength,
        redactedLength: redactedText.length,
        linesProcessed: originalLines,
      },
    };
  },
});

export default redactSecrets;

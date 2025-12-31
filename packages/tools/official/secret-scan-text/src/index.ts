/**
 * Secret Scan Text Tool for TPMJS
 * Scans text for potential secrets using regex patterns
 *
 * Detects:
 * - API keys (generic patterns)
 * - AWS credentials (access keys, secret keys)
 * - GitHub tokens
 * - Slack tokens
 * - OpenAI API keys
 * - Stripe API keys
 * - JWT tokens
 * - Private keys
 * - Database connection strings
 * - Generic passwords in code
 */

import { jsonSchema, tool } from 'ai';

export interface SecretMatch {
  type: string;
  value: string;
  line: number;
  column: number;
  context: string; // Surrounding text
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecretScanResult {
  secrets: SecretMatch[];
  secretCount: number;
  patterns: Array<{
    type: string;
    count: number;
  }>;
  metadata: {
    linesScanned: number;
    scanDurationMs: number;
  };
}

type SecretScanInput = {
  text: string;
};

/**
 * Secret detection patterns with descriptions
 */
const SECRET_PATTERNS: Array<{
  type: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}> = [
  // AWS Credentials
  {
    type: 'aws-access-key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    description: 'AWS Access Key ID',
  },
  {
    type: 'aws-secret-key',
    pattern: /aws(.{0,20})?['\"][0-9a-zA-Z/+]{40}['\"]/gi,
    severity: 'critical',
    description: 'AWS Secret Access Key',
  },
  {
    type: 'aws-account-id',
    pattern: /aws(.{0,20})?['\"]?[0-9]{12}['\"]?/gi,
    severity: 'medium',
    description: 'AWS Account ID',
  },

  // GitHub
  {
    type: 'github-token',
    pattern: /gh[pousr]_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    description: 'GitHub Personal Access Token',
  },
  {
    type: 'github-oauth',
    pattern: /gho_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    description: 'GitHub OAuth Token',
  },

  // Slack
  {
    type: 'slack-token',
    pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
    severity: 'critical',
    description: 'Slack Token',
  },
  {
    type: 'slack-webhook',
    pattern:
      /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
    severity: 'high',
    description: 'Slack Webhook URL',
  },

  // OpenAI
  {
    type: 'openai-api-key',
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    severity: 'critical',
    description: 'OpenAI API Key',
  },

  // Stripe
  {
    type: 'stripe-api-key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'critical',
    description: 'Stripe Live API Key',
  },
  {
    type: 'stripe-restricted-key',
    pattern: /rk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'high',
    description: 'Stripe Restricted Key',
  },

  // Generic API Keys
  {
    type: 'generic-api-key',
    pattern: /api[_-]?key['\"]?\s*[:=]\s*['\"]?[0-9a-zA-Z_\-]{20,}['\"]?/gi,
    severity: 'high',
    description: 'Generic API Key',
  },
  {
    type: 'generic-secret',
    pattern: /secret['\"]?\s*[:=]\s*['\"]?[0-9a-zA-Z_\-]{20,}['\"]?/gi,
    severity: 'high',
    description: 'Generic Secret',
  },

  // JWT Tokens
  {
    type: 'jwt-token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'high',
    description: 'JWT Token',
  },

  // Private Keys
  {
    type: 'private-key',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'Private Key',
  },

  // Database Connection Strings
  {
    type: 'postgres-connection',
    pattern:
      /postgres(ql)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_\-@$!%*?&]+@[a-zA-Z0-9._-]+(:[0-9]+)?\/[a-zA-Z0-9_-]+/gi,
    severity: 'critical',
    description: 'PostgreSQL Connection String',
  },
  {
    type: 'mysql-connection',
    pattern:
      /mysql:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_\-@$!%*?&]+@[a-zA-Z0-9._-]+(:[0-9]+)?\/[a-zA-Z0-9_-]+/gi,
    severity: 'critical',
    description: 'MySQL Connection String',
  },
  {
    type: 'mongodb-connection',
    pattern:
      /mongodb(\+srv)?:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_\-@$!%*?&]+@[a-zA-Z0-9._-]+(:[0-9]+)?\/[a-zA-Z0-9_-]+/gi,
    severity: 'critical',
    description: 'MongoDB Connection String',
  },

  // Generic Passwords in Code
  {
    type: 'hardcoded-password',
    pattern: /password['\"]?\s*[:=]\s*['\"][^'\"]{8,}['\"](?!\s*=)/gi,
    severity: 'high',
    description: 'Hardcoded Password',
  },

  // Google API Keys
  {
    type: 'google-api-key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'high',
    description: 'Google API Key',
  },

  // Twilio
  {
    type: 'twilio-api-key',
    pattern: /SK[0-9a-fA-F]{32}/g,
    severity: 'high',
    description: 'Twilio API Key',
  },

  // SendGrid
  {
    type: 'sendgrid-api-key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: 'high',
    description: 'SendGrid API Key',
  },

  // Mailchimp
  {
    type: 'mailchimp-api-key',
    pattern: /[0-9a-f]{32}-us[0-9]{1,2}/g,
    severity: 'medium',
    description: 'Mailchimp API Key',
  },

  // Generic Bearer Tokens
  {
    type: 'bearer-token',
    pattern: /bearer\s+[a-zA-Z0-9_\-\.=]{20,}/gi,
    severity: 'high',
    description: 'Bearer Token',
  },

  // SSH Private Keys (DSA/RSA/ECDSA/ED25519)
  {
    type: 'ssh-private-key',
    pattern:
      /-----BEGIN (DSA|RSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (DSA|RSA|EC|OPENSSH) PRIVATE KEY-----/g,
    severity: 'critical',
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
 * Get context around a match (50 chars before and after)
 */
function getContext(text: string, index: number, matchLength: number): string {
  const contextLength = 50;
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + matchLength + contextLength);

  let context = text.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) context = `...${context}`;
  if (end < text.length) context = `${context}...`;

  return context;
}

/**
 * Secret scanning tool
 */
export const secretScanText = tool({
  description:
    'Scan text for potential secrets using regex patterns. Detects API keys, tokens, passwords, AWS credentials, GitHub tokens, Slack tokens, database connection strings, and more. Returns all matches with location and severity.',
  inputSchema: jsonSchema<SecretScanInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to scan for secrets (code, configuration files, logs, etc.)',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<SecretScanResult> {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    const startTime = Date.now();
    const secrets: SecretMatch[] = [];
    const patternCounts = new Map<string, number>();

    // Scan text with each pattern
    for (const { type, pattern, severity } of SECRET_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex pattern for exec loop
      while ((match = pattern.exec(text)) !== null) {
        const { line, column } = getLineAndColumn(text, match.index);
        const context = getContext(text, match.index, match[0].length);

        secrets.push({
          type,
          value: match[0],
          line,
          column,
          context,
          severity,
        });

        // Update pattern count
        patternCounts.set(type, (patternCounts.get(type) || 0) + 1);
      }
    }

    // Sort by line number
    secrets.sort((a, b) => a.line - b.line);

    // Build pattern summary
    const patterns = Array.from(patternCounts.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    const scanDurationMs = Date.now() - startTime;
    const linesScanned = text.split('\n').length;

    return {
      secrets,
      secretCount: secrets.length,
      patterns,
      metadata: {
        linesScanned,
        scanDurationMs,
      },
    };
  },
});

export default secretScanText;

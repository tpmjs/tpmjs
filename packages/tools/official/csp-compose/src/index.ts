/**
 * CSP Compose Tool for TPMJS
 * Composes Content Security Policy headers from directive configurations.
 * Validates directives and checks for strict CSP patterns.
 *
 * Domain rule: csp-validation - Validates CSP directives against W3C Content Security Policy spec
 * Domain rule: xss-protection-detection - Detects unsafe CSP patterns ('unsafe-inline', 'unsafe-eval', wildcards)
 * Domain rule: nonce-hash-verification - Verifies strict CSP usage with nonces/hashes for script sources
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for CSP composition
 */
export interface CSPResult {
  header: string;
  directives: Array<{
    directive: string;
    sources: string[];
  }>;
  isStrict: boolean;
  warnings: string[];
}

type CSPComposeInput = {
  allow: Record<string, string[]>;
};

/**
 * Valid CSP directive names
 */
const VALID_DIRECTIVES = new Set([
  'default-src',
  'script-src',
  'style-src',
  'img-src',
  'font-src',
  'connect-src',
  'media-src',
  'object-src',
  'frame-src',
  'child-src',
  'worker-src',
  'manifest-src',
  'base-uri',
  'form-action',
  'frame-ancestors',
  'report-uri',
  'report-to',
  'upgrade-insecure-requests',
  'block-all-mixed-content',
]);

/**
 * Unsafe CSP sources that weaken security
 */
const UNSAFE_SOURCES = new Set(["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"]);

/**
 * Validates a CSP directive name
 */
function isValidDirective(directive: string): boolean {
  return VALID_DIRECTIVES.has(directive);
}

/**
 * Checks if a policy is considered strict
 * A strict CSP:
 * - Uses nonces or hashes for scripts
 * - Avoids 'unsafe-inline' and 'unsafe-eval'
 * - Has a restrictive default-src
 */
function isStrictCSP(policies: Record<string, string[]>): boolean {
  // Check for unsafe sources in critical directives
  const criticalDirectives = ['default-src', 'script-src', 'style-src'];

  for (const directive of criticalDirectives) {
    const sources = policies[directive] || [];
    for (const source of sources) {
      if (UNSAFE_SOURCES.has(source)) {
        return false;
      }
    }
  }

  // Check if script-src uses nonces or hashes
  const scriptSrc = policies['script-src'] || policies['default-src'] || [];
  const hasNonceOrHash = scriptSrc.some(
    (source) => source.startsWith("'nonce-") || source.startsWith("'sha")
  );

  // Check for restrictive default-src
  const defaultSrc = policies['default-src'] || [];
  const hasRestrictiveDefault = defaultSrc.includes("'self'") || defaultSrc.includes("'none'");

  return hasNonceOrHash && hasRestrictiveDefault;
}

/**
 * Generates warnings for common CSP issues
 */
function generateWarnings(policies: Record<string, string[]>): string[] {
  const warnings: string[] = [];

  // Check for unsafe-inline
  for (const [directive, sources] of Object.entries(policies)) {
    if (sources.includes("'unsafe-inline'")) {
      warnings.push(
        `${directive} contains 'unsafe-inline' which allows inline scripts/styles and weakens CSP protection`
      );
    }
    if (sources.includes("'unsafe-eval'")) {
      warnings.push(
        `${directive} contains 'unsafe-eval' which allows eval() and similar functions, creating XSS risks`
      );
    }
  }

  // Check for wildcard sources
  for (const [directive, sources] of Object.entries(policies)) {
    if (sources.includes('*')) {
      warnings.push(`${directive} contains wildcard (*) which allows resources from any origin`);
    }
    if (sources.some((s) => s.startsWith('*.'))) {
      warnings.push(
        `${directive} contains subdomain wildcard (*.domain) which may be overly permissive`
      );
    }
  }

  // Check if default-src is missing
  if (!policies['default-src']) {
    warnings.push(
      "Missing 'default-src' directive - consider adding a restrictive default fallback"
    );
  }

  // Check for missing object-src
  if (!policies['object-src']) {
    warnings.push(
      "Missing 'object-src' directive - consider adding \"object-src 'none'\" to block plugins"
    );
  }

  // Check for missing base-uri
  if (!policies['base-uri']) {
    warnings.push(
      "Missing 'base-uri' directive - consider adding \"base-uri 'self'\" to prevent base tag injection"
    );
  }

  return warnings;
}

/**
 * Formats sources for a directive
 */
function formatSources(sources: string[]): string {
  // Remove duplicates and sort
  const uniqueSources = Array.from(new Set(sources));
  return uniqueSources.join(' ');
}

/**
 * CSP Compose Tool
 * Composes a Content Security Policy header from directive configurations
 */
export const cspComposeTool = tool({
  description:
    'Compose a Content Security Policy (CSP) header from directive configurations. Validates directives, checks for security issues, and determines if the policy is strict. Returns the formatted CSP header string, directive details, and security warnings.',
  inputSchema: jsonSchema<CSPComposeInput>({
    type: 'object',
    properties: {
      allow: {
        type: 'object',
        description:
          'CSP directives mapped to arrays of allowed source values. Example: { "default-src": ["\'self\'"], "script-src": ["\'nonce-abc123\'", "https://cdn.example.com"] }',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    required: ['allow'],
    additionalProperties: false,
  }),
  async execute({ allow }): Promise<CSPResult> {
    // Validate input
    if (!allow || typeof allow !== 'object') {
      throw new Error('Allow must be an object mapping directives to source arrays');
    }

    if (Object.keys(allow).length === 0) {
      throw new Error('At least one CSP directive is required');
    }

    // Rename for consistency with rest of function
    const policies = allow;

    // Validate and build directives
    const directives: Array<{ directive: string; sources: string[] }> = [];
    const headerParts: string[] = [];

    for (const [directive, sources] of Object.entries(policies)) {
      // Validate directive name
      if (!isValidDirective(directive)) {
        throw new Error(
          `Invalid CSP directive: "${directive}". Must be one of: ${Array.from(VALID_DIRECTIVES).join(', ')}`
        );
      }

      // Validate sources is an array
      if (!Array.isArray(sources)) {
        throw new Error(`Sources for directive "${directive}" must be an array`);
      }

      // Handle directives without values (flags)
      if (directive === 'upgrade-insecure-requests' || directive === 'block-all-mixed-content') {
        directives.push({ directive, sources: [] });
        headerParts.push(directive);
        continue;
      }

      // Validate sources is not empty for value directives
      if (sources.length === 0) {
        throw new Error(`Directive "${directive}" requires at least one source value`);
      }

      // Validate each source
      for (const source of sources) {
        if (typeof source !== 'string' || source.trim().length === 0) {
          throw new Error(
            `Invalid source value in "${directive}": sources must be non-empty strings`
          );
        }
      }

      // Build directive string
      const formattedSources = formatSources(sources);
      directives.push({ directive, sources: [...sources] });
      headerParts.push(`${directive} ${formattedSources}`);
    }

    // Build the final header
    const header = headerParts.join('; ');

    // Check if the policy is strict
    const isStrict = isStrictCSP(policies);

    // Generate warnings
    const warnings = generateWarnings(policies);

    return {
      header,
      directives,
      isStrict,
      warnings,
    };
  },
});

export default cspComposeTool;

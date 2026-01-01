/**
 * URL Risk Heuristic Tool for TPMJS
 * Analyzes URLs for security risks using heuristics
 *
 * Checks for:
 * - IP addresses (v4 and v6)
 * - Suspicious TLDs
 * - Excessively long URLs
 * - Unicode tricks and homograph attacks
 * - Known phishing patterns
 * - Multiple subdomains
 * - URL shorteners
 *
 * Domain rule: phishing-detection - Detects phishing indicators (suspicious TLDs, URL shorteners, brand keywords)
 * Domain rule: homograph-attack-detection - Identifies punycode domains and lookalike unicode characters
 * Domain rule: url-structure-analysis - Analyzes URL structure (IP addresses, excessive subdomains, path traversal)
 * Domain rule: protocol-security-validation - Validates secure protocols (HTTPS) and checks for non-standard ports
 * Domain rule: risk-scoring - Calculates weighted risk score from 0 to 1 based on detected threats
 */

import { jsonSchema, tool } from 'ai';

export interface UrlRiskAnalysis {
  url: string;
  riskScore: number; // 0 to 1, where 1 is highest risk
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  recommendations: string[];
  isHighRisk: boolean; // true if riskScore >= 0.6
  metadata: {
    hostname: string;
    protocol: string;
    pathLength: number;
    hasPort: boolean;
  };
}

type UrlRiskInput = {
  url: string;
};

/**
 * Suspicious TLDs commonly used in phishing
 */
const SUSPICIOUS_TLDS = new Set([
  'tk',
  'ml',
  'ga',
  'cf',
  'gq', // Free TLDs
  'xyz',
  'top',
  'work',
  'click',
  'link', // Often abused
  'ru',
  'cn', // Sometimes flagged (context-dependent)
]);

/**
 * Known URL shortener domains
 */
const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
]);

/**
 * Suspicious keywords in URLs
 */
const SUSPICIOUS_KEYWORDS = [
  'login',
  'signin',
  'account',
  'verify',
  'secure',
  'update',
  'confirm',
  'banking',
  'paypal',
  'apple',
  'microsoft',
  'google',
  'amazon',
  'suspended',
];

/**
 * Check if URL contains an IP address (IPv4 or IPv6)
 */
function hasIpAddress(hostname: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^[0-9a-f:]+$/i;

  return ipv4Pattern.test(hostname) || (hostname.includes(':') && ipv6Pattern.test(hostname));
}

/**
 * Check if domain contains punycode (IDN homograph attack vector)
 */
function hasPunycode(hostname: string): boolean {
  // Punycode domains start with 'xn--'
  return hostname.includes('xn--');
}

/**
 * Check for unicode/homograph attacks
 */
function hasUnicodeTricks(url: string): boolean {
  // Check for non-ASCII characters
  const hasNonAscii = /[^\x00-\x7F]/.test(url);

  // Check for mixed scripts (Cyrillic, Greek, etc. mixed with Latin)
  const hasCyrillic = /[\u0400-\u04FF]/.test(url);
  const hasGreek = /[\u0370-\u03FF]/.test(url);

  // Check for lookalike characters
  const lookalikes = /[а-яА-Я]/; // Cyrillic that looks like Latin

  return hasNonAscii || hasCyrillic || hasGreek || lookalikes.test(url);
}

/**
 * Count number of subdomains
 */
function countSubdomains(hostname: string): number {
  const parts = hostname.split('.');
  // Subtract TLD and domain (last 2 parts)
  return Math.max(0, parts.length - 2);
}

/**
 * Check if URL contains suspicious patterns
 */
function checkSuspiciousPatterns(url: string): string[] {
  const patterns: string[] = [];
  const lowerUrl = url.toLowerCase();

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (lowerUrl.includes(keyword)) {
      patterns.push(keyword);
    }
  }

  // Check for @ symbol (often used to trick users)
  if (url.includes('@')) {
    patterns.push('@-symbol');
  }

  // Check for excessive dashes or dots
  if (/[-]{3,}/.test(url)) {
    patterns.push('excessive-dashes');
  }

  return patterns;
}

/**
 * Main URL risk analysis tool
 */
export const urlRiskHeuristic = tool({
  description:
    'Analyze a URL for security risks using heuristics. Checks for IP addresses, suspicious TLDs, long URLs, unicode tricks, known phishing patterns, multiple subdomains, and URL shorteners. Returns a risk score from 0 to 1.',
  inputSchema: jsonSchema<UrlRiskInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to analyze for security risks',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url }): Promise<UrlRiskAnalysis> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }

    const risks: UrlRiskAnalysis['risks'] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    const { hostname, protocol, pathname, port } = parsedUrl;

    // Check 1: IP address instead of domain
    if (hasIpAddress(hostname)) {
      risks.push({
        type: 'ip-address',
        severity: 'high',
        description: 'URL uses an IP address instead of a domain name',
      });
      riskScore += 0.3;
      recommendations.push('Legitimate websites typically use domain names, not IP addresses');
    }

    // Check 2: Non-HTTPS protocol
    if (protocol !== 'https:') {
      risks.push({
        type: 'insecure-protocol',
        severity: 'medium',
        description: `URL uses insecure protocol: ${protocol}`,
      });
      riskScore += 0.15;
      recommendations.push('Use HTTPS for secure communication');
    }

    // Check 3: Suspicious TLD
    const tld = hostname.split('.').pop()?.toLowerCase();
    if (tld && SUSPICIOUS_TLDS.has(tld)) {
      risks.push({
        type: 'suspicious-tld',
        severity: 'medium',
        description: `TLD ".${tld}" is commonly used in phishing attacks`,
      });
      riskScore += 0.2;
      recommendations.push('Be cautious of free or commonly abused TLDs');
    }

    // Check 4: URL shortener
    if (URL_SHORTENERS.has(hostname)) {
      risks.push({
        type: 'url-shortener',
        severity: 'medium',
        description: 'URL is a known URL shortener, hiding the real destination',
      });
      riskScore += 0.15;
      recommendations.push('Expand shortened URLs to see the real destination before clicking');
    }

    // Check 5: Excessive URL length
    if (url.length > 200) {
      risks.push({
        type: 'long-url',
        severity: 'low',
        description: `URL is excessively long (${url.length} characters)`,
      });
      riskScore += 0.1;
      recommendations.push('Long URLs can be used to hide malicious content');
    }

    // Check 6: Punycode domain (IDN)
    if (hasPunycode(hostname)) {
      risks.push({
        type: 'punycode-domain',
        severity: 'high',
        description: 'URL uses punycode/IDN encoding (xn--), potential for homograph attacks',
      });
      riskScore += 0.3;
      recommendations.push(
        'Punycode domains can disguise lookalike characters - verify the actual domain carefully'
      );
    }

    // Check 7: Unicode/homograph attacks
    if (hasUnicodeTricks(hostname)) {
      risks.push({
        type: 'unicode-tricks',
        severity: 'critical',
        description: 'URL contains non-ASCII or lookalike characters (possible homograph attack)',
      });
      riskScore += 0.4;
      recommendations.push('Check for lookalike characters that mimic legitimate domains');
    }

    // Check 8: Excessive subdomains
    const subdomainCount = countSubdomains(hostname);
    if (subdomainCount > 3) {
      risks.push({
        type: 'excessive-subdomains',
        severity: 'medium',
        description: `URL has ${subdomainCount} subdomains, which is unusual`,
      });
      riskScore += 0.15;
      recommendations.push('Multiple subdomains can be used to impersonate legitimate sites');
    }

    // Check 9: Suspicious patterns/keywords
    const suspiciousPatterns = checkSuspiciousPatterns(url);
    if (suspiciousPatterns.length > 0) {
      risks.push({
        type: 'suspicious-keywords',
        severity: 'medium',
        description: `URL contains suspicious keywords: ${suspiciousPatterns.join(', ')}`,
      });
      riskScore += 0.1 * Math.min(suspiciousPatterns.length, 3); // Max 0.3
      recommendations.push('Suspicious keywords often indicate phishing attempts');
    }

    // Check 10: Non-standard port
    if (port && !['80', '443'].includes(port)) {
      risks.push({
        type: 'non-standard-port',
        severity: 'low',
        description: `URL uses non-standard port: ${port}`,
      });
      riskScore += 0.05;
      recommendations.push('Non-standard ports can indicate unusual server configuration');
    }

    // Check 11: Path traversal attempts
    if (pathname.includes('..') || pathname.includes('//')) {
      risks.push({
        type: 'path-traversal',
        severity: 'high',
        description: 'URL contains potential path traversal patterns',
      });
      riskScore += 0.25;
      recommendations.push('Path traversal patterns may indicate an attack attempt');
    }

    // Normalize risk score to 0-1 range
    riskScore = Math.min(1, riskScore);

    // Add general recommendations if high risk
    if (riskScore >= 0.6) {
      recommendations.push('DO NOT click this link or enter sensitive information');
      recommendations.push('Verify the URL with the sender through a different channel');
    }

    return {
      url,
      riskScore: Number.parseFloat(riskScore.toFixed(2)),
      risks,
      recommendations,
      isHighRisk: riskScore >= 0.6,
      metadata: {
        hostname,
        protocol,
        pathLength: pathname.length,
        hasPort: !!port,
      },
    };
  },
});

export default urlRiskHeuristic;

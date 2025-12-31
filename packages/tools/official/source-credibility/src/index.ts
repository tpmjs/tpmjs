/**
 * Source Credibility Tool for TPMJS
 * Analyzes a URL for credibility signals using heuristics like HTTPS,
 * domain reputation, author presence, publication date, and citation density.
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';
import * as cheerio from 'cheerio';
import { parse as parseDomain } from 'tldts';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Source Credibility tool requires Node.js 18+ with native fetch support');
}

/**
 * Individual credibility signal with score and explanation
 */
export interface CredibilitySignal {
  name: string;
  score: number; // 0-1
  weight: number; // How much this signal contributes
  explanation: string;
}

/**
 * Output interface for credibility analysis
 */
export interface CredibilityScore {
  url: string;
  domain: string;
  overallScore: number; // 0-1 weighted score
  confidence: 'low' | 'medium' | 'high';
  signals: CredibilitySignal[];
  warnings: string[];
  recommendations: string[];
  metadata: {
    analyzedAt: string;
    htmlProvided: boolean;
  };
}

type SourceCredibilityInput = {
  url: string;
  html?: string;
};

/**
 * Known high-credibility domain suffixes
 */
const HIGH_TRUST_TLDS = ['.edu', '.gov', '.mil'];

/**
 * Known reputable domains (major news, research institutions)
 */
const REPUTABLE_DOMAINS = new Set([
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'bbc.co.uk',
  'npr.org',
  'pbs.org',
  'nature.com',
  'science.org',
  'nejm.org',
  'thelancet.com',
  'arxiv.org',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'economist.com',
  'wsj.com',
  'harvard.edu',
  'mit.edu',
  'stanford.edu',
  'who.int',
  'cdc.gov',
  'nih.gov',
]);

/**
 * Known low-credibility indicators
 */
const LOW_TRUST_PATTERNS = [
  /blog\..*\.com$/,
  /wordpress\.com$/,
  /blogspot\.com$/,
  /medium\.com$/,
  /substack\.com$/,
];

/**
 * Validates URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Analyze HTTPS usage
 */
function analyzeHttps(url: string): CredibilitySignal {
  const isHttps = url.startsWith('https://');
  return {
    name: 'HTTPS Security',
    score: isHttps ? 1.0 : 0.2,
    weight: 0.1,
    explanation: isHttps
      ? 'Site uses HTTPS encryption'
      : 'Site does not use HTTPS - connection is not secure',
  };
}

/**
 * Analyze domain reputation
 */
function analyzeDomain(url: string): CredibilitySignal {
  const parsed = parseDomain(url);
  const domain = parsed.domain || '';
  const tld = parsed.publicSuffix || '';

  // Check high-trust TLDs
  for (const trustTld of HIGH_TRUST_TLDS) {
    if (url.includes(trustTld)) {
      return {
        name: 'Domain Reputation',
        score: 0.95,
        weight: 0.25,
        explanation: `${trustTld} domain indicates institutional source`,
      };
    }
  }

  // Check reputable domains
  const fullDomain = `${domain}.${tld}`;
  if (REPUTABLE_DOMAINS.has(fullDomain)) {
    return {
      name: 'Domain Reputation',
      score: 0.9,
      weight: 0.25,
      explanation: `${fullDomain} is a recognized reputable source`,
    };
  }

  // Check low-trust patterns
  for (const pattern of LOW_TRUST_PATTERNS) {
    if (pattern.test(fullDomain)) {
      return {
        name: 'Domain Reputation',
        score: 0.4,
        weight: 0.25,
        explanation: `${fullDomain} is a user-generated content platform`,
      };
    }
  }

  // Neutral domain
  return {
    name: 'Domain Reputation',
    score: 0.5,
    weight: 0.25,
    explanation: `${fullDomain} has unknown reputation - verify independently`,
  };
}

/**
 * Analyze author presence in HTML
 */
function analyzeAuthor($: cheerio.CheerioAPI): CredibilitySignal {
  // Common author selectors
  const authorSelectors = [
    '[rel="author"]',
    '.author',
    '.byline',
    '[itemprop="author"]',
    '.post-author',
    '.article-author',
    'meta[name="author"]',
  ];

  for (const selector of authorSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const authorText = element.text().trim() || element.attr('content') || '';
      if (authorText.length > 2) {
        return {
          name: 'Author Attribution',
          score: 0.8,
          weight: 0.2,
          explanation: `Author identified: "${authorText.substring(0, 50)}"`,
        };
      }
    }
  }

  return {
    name: 'Author Attribution',
    score: 0.3,
    weight: 0.2,
    explanation: 'No author information found - anonymous content',
  };
}

/**
 * Analyze publication date presence
 */
function analyzeDate($: cheerio.CheerioAPI): CredibilitySignal {
  // Common date selectors
  const dateSelectors = [
    'time[datetime]',
    '[itemprop="datePublished"]',
    '[itemprop="dateModified"]',
    '.publish-date',
    '.post-date',
    '.article-date',
    'meta[property="article:published_time"]',
  ];

  for (const selector of dateSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const dateText = element.attr('datetime') || element.attr('content') || element.text().trim();
      if (dateText) {
        // Try to parse as date
        const date = new Date(dateText);
        if (!Number.isNaN(date.getTime())) {
          const ageInDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
          const isRecent = ageInDays < 365;
          return {
            name: 'Publication Date',
            score: isRecent ? 0.9 : 0.7,
            weight: 0.15,
            explanation: `Published ${ageInDays} days ago (${date.toISOString().split('T')[0]})`,
          };
        }
      }
    }
  }

  return {
    name: 'Publication Date',
    score: 0.4,
    weight: 0.15,
    explanation: 'No publication date found - content age unknown',
  };
}

/**
 * Analyze citations and references
 */
function analyzeCitations($: cheerio.CheerioAPI): CredibilitySignal {
  // Count external links (potential citations)
  const links = $('a[href^="http"]');
  const externalLinks: string[] = [];

  links.each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      externalLinks.push(href);
    }
  });

  // Count links that look like citations
  const citationCount = externalLinks.filter((href) => {
    return (
      href.includes('doi.org') ||
      href.includes('pubmed') ||
      href.includes('scholar.google') ||
      href.includes('arxiv.org') ||
      href.includes('wikipedia.org') ||
      /\.(edu|gov|org)\//.test(href)
    );
  }).length;

  if (citationCount >= 3) {
    return {
      name: 'Citations & References',
      score: 0.9,
      weight: 0.2,
      explanation: `Found ${citationCount} potential citations to credible sources`,
    };
  }

  if (citationCount >= 1) {
    return {
      name: 'Citations & References',
      score: 0.6,
      weight: 0.2,
      explanation: `Found ${citationCount} potential citation(s) to credible sources`,
    };
  }

  if (externalLinks.length >= 5) {
    return {
      name: 'Citations & References',
      score: 0.5,
      weight: 0.2,
      explanation: `Found ${externalLinks.length} external links (no academic citations)`,
    };
  }

  return {
    name: 'Citations & References',
    score: 0.3,
    weight: 0.2,
    explanation: 'Few or no external references found',
  };
}

/**
 * Analyze contact information
 */
function analyzeContact($: cheerio.CheerioAPI): CredibilitySignal {
  const hasContact =
    $('a[href*="contact"]').length > 0 ||
    $('a[href*="about"]').length > 0 ||
    $('a[href^="mailto:"]').length > 0 ||
    $('.contact').length > 0 ||
    $('#contact').length > 0;

  return {
    name: 'Contact Information',
    score: hasContact ? 0.7 : 0.4,
    weight: 0.1,
    explanation: hasContact
      ? 'Contact or about page links found'
      : 'No obvious contact information found',
  };
}

/**
 * Calculate overall score from signals
 */
function calculateOverallScore(signals: CredibilitySignal[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    weightedSum += signal.score * signal.weight;
    totalWeight += signal.weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Determine confidence level based on available signals
 */
function determineConfidence(
  htmlProvided: boolean,
  signalCount: number
): 'low' | 'medium' | 'high' {
  if (!htmlProvided) return 'low';
  if (signalCount >= 5) return 'high';
  if (signalCount >= 3) return 'medium';
  return 'low';
}

/**
 * Generate warnings based on signals
 */
function generateWarnings(signals: CredibilitySignal[], url: string): string[] {
  const warnings: string[] = [];

  for (const signal of signals) {
    if (signal.score < 0.4) {
      warnings.push(`Low score for ${signal.name}: ${signal.explanation}`);
    }
  }

  if (!url.startsWith('https://')) {
    warnings.push('This site does not use HTTPS encryption');
  }

  return warnings;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(signals: CredibilitySignal[], overallScore: number): string[] {
  const recommendations: string[] = [];

  if (overallScore < 0.5) {
    recommendations.push('Cross-reference claims with other reputable sources');
    recommendations.push('Look for primary sources cited in this article');
  }

  const authorSignal = signals.find((s) => s.name === 'Author Attribution');
  if (authorSignal && authorSignal.score < 0.5) {
    recommendations.push('Try to identify and verify the author credentials');
  }

  const citationSignal = signals.find((s) => s.name === 'Citations & References');
  if (citationSignal && citationSignal.score < 0.5) {
    recommendations.push('Look for original sources for any claims made');
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'This source appears relatively credible, but always verify important claims'
    );
  }

  return recommendations;
}

/**
 * Source Credibility Tool
 * Analyzes a URL for credibility signals
 */
export const sourceCredibilityTool = tool({
  description:
    'Analyze a URL for credibility signals including HTTPS, domain reputation, author presence, publication date, and citations. Returns a score from 0-1 with detailed breakdown and recommendations.',
  inputSchema: jsonSchema<SourceCredibilityInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to analyze for credibility',
      },
      html: {
        type: 'string',
        description: 'Optional pre-fetched HTML content to analyze',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  async execute({ url, html: providedHtml }): Promise<CredibilityScore> {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: ${url}. Must be a valid http or https URL.`);
    }

    const parsed = parseDomain(url);
    const domain = parsed.domain
      ? `${parsed.domain}.${parsed.publicSuffix}`
      : new URL(url).hostname;

    // Get HTML content
    let html = providedHtml;
    if (!html) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        html = await response.text();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to fetch URL ${url}: ${message}`);
      }
    }

    // Parse HTML
    const $ = cheerio.load(html);

    // Collect signals
    const signals: CredibilitySignal[] = [
      analyzeHttps(url),
      analyzeDomain(url),
      analyzeAuthor($),
      analyzeDate($),
      analyzeCitations($),
      analyzeContact($),
    ];

    // Calculate overall score
    const overallScore = calculateOverallScore(signals);
    const confidence = determineConfidence(true, signals.length);
    const warnings = generateWarnings(signals, url);
    const recommendations = generateRecommendations(signals, overallScore);

    return {
      url,
      domain,
      overallScore: Math.round(overallScore * 100) / 100,
      confidence,
      signals,
      warnings,
      recommendations,
      metadata: {
        analyzedAt: new Date().toISOString(),
        htmlProvided: !!providedHtml,
      },
    };
  },
});

export default sourceCredibilityTool;

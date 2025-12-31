/**
 * Robots Policy Tool for TPMJS
 * Parses robots.txt files and checks if URLs are allowed for crawling
 *
 * @requires Node.js 18+ (uses native fetch API)
 */

import { jsonSchema, tool } from 'ai';

// Verify fetch is available (Node.js 18+)
if (typeof globalThis.fetch !== 'function') {
  throw new Error('Robots Policy tool requires Node.js 18+ with native fetch support');
}

/**
 * Robots.txt rule interface
 */
export interface RobotsRule {
  userAgent: string;
  rules: Array<{
    directive: 'allow' | 'disallow';
    path: string;
  }>;
  crawlDelay?: number;
  sitemaps?: string[];
}

/**
 * Output interface for robots policy check
 */
export interface RobotsPolicy {
  allowed: boolean;
  userAgent: string;
  testUrl: string;
  matchedRule?: {
    directive: 'allow' | 'disallow';
    path: string;
  };
  rules: RobotsRule[];
  crawlDelay?: number;
  sitemaps: string[];
  metadata: {
    fetchedAt: string;
    robotsUrl: string;
    hasRules: boolean;
  };
}

type RobotsPolicyInput = {
  robotsUrl: string;
  testUrl: string;
  userAgent?: string;
};

/**
 * Validates that a string is a valid URL
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
 * Converts glob-style pattern to regex
 * Supports * (any characters) and $ (end of URL)
 */
function patternToRegex(pattern: string): RegExp {
  // Escape special regex characters except * and $
  let regexStr = pattern.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

  // Handle $ for end of URL
  if (regexStr.endsWith('$')) {
    regexStr = `${regexStr.slice(0, -1)}$`;
  } else {
    // If no $, pattern matches if URL starts with it
    regexStr = `^${regexStr}`;
  }

  return new RegExp(regexStr);
}

/**
 * Checks if a URL matches a robots.txt pattern
 */
function urlMatchesPattern(url: string, pattern: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    const regex = patternToRegex(pattern);
    return regex.test(path);
  } catch {
    return false;
  }
}

/**
 * Parses robots.txt content into structured rules
 */
function parseRobotsTxt(content: string): {
  rules: RobotsRule[];
  globalSitemaps: string[];
} {
  const lines = content.split('\n');
  const rules: RobotsRule[] = [];
  const globalSitemaps: string[] = [];
  let currentUserAgent: string | null = null;
  let currentRules: Array<{ directive: 'allow' | 'disallow'; path: string }> = [];
  let currentCrawlDelay: number | undefined;

  const saveCurrentRule = () => {
    if (currentUserAgent && currentRules.length > 0) {
      rules.push({
        userAgent: currentUserAgent,
        rules: currentRules,
        crawlDelay: currentCrawlDelay,
      });
    }
    currentRules = [];
    currentCrawlDelay = undefined;
  };

  for (let line of lines) {
    // Remove comments and trim
    const commentIndex = line.indexOf('#');
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex);
    }
    line = line.trim();

    if (!line) continue;

    // Parse directive
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    if (!value) continue;

    switch (directive) {
      case 'user-agent':
        saveCurrentRule();
        currentUserAgent = value.toLowerCase();
        break;

      case 'disallow':
        if (currentUserAgent) {
          currentRules.push({ directive: 'disallow', path: value });
        }
        break;

      case 'allow':
        if (currentUserAgent) {
          currentRules.push({ directive: 'allow', path: value });
        }
        break;

      case 'crawl-delay':
        if (currentUserAgent) {
          const delay = Number.parseFloat(value);
          if (!Number.isNaN(delay)) {
            currentCrawlDelay = delay;
          }
        }
        break;

      case 'sitemap':
        globalSitemaps.push(value);
        break;
    }
  }

  // Save the last rule
  saveCurrentRule();

  return { rules, globalSitemaps };
}

/**
 * Finds the most specific matching rule for a user agent and URL
 */
function findMatchingRule(
  rules: RobotsRule[],
  userAgent: string,
  testUrl: string
): {
  allowed: boolean;
  matchedRule?: { directive: 'allow' | 'disallow'; path: string };
  crawlDelay?: number;
} {
  const normalizedUserAgent = userAgent.toLowerCase();

  // Find rules that apply to this user agent
  // Check for exact match first, then wildcard
  let applicableRules: RobotsRule | undefined = rules.find(
    (r) => r.userAgent === normalizedUserAgent
  );

  if (!applicableRules) {
    applicableRules = rules.find((r) => r.userAgent === '*');
  }

  if (!applicableRules) {
    // No rules found, allow by default
    return { allowed: true };
  }

  // Find the most specific matching rule
  // Rules are processed in order, and more specific (longer) patterns take precedence
  let longestMatch: { directive: 'allow' | 'disallow'; path: string } | undefined;
  let longestMatchLength = 0;

  for (const rule of applicableRules.rules) {
    if (urlMatchesPattern(testUrl, rule.path)) {
      // The length of the pattern determines specificity
      const pathLength = rule.path.length;
      if (pathLength > longestMatchLength) {
        longestMatch = rule;
        longestMatchLength = pathLength;
      }
    }
  }

  if (longestMatch) {
    return {
      allowed: longestMatch.directive === 'allow',
      matchedRule: longestMatch,
      crawlDelay: applicableRules.crawlDelay,
    };
  }

  // No matching rules, allow by default
  return {
    allowed: true,
    crawlDelay: applicableRules.crawlDelay,
  };
}

/**
 * Robots Policy Tool
 * Parses robots.txt and checks if a URL is allowed for crawling
 */
export const robotsPolicyTool = tool({
  description:
    'Parse a robots.txt file and check if a specific URL is allowed to be crawled by a given user agent. Returns whether the URL is allowed, the matching rule, all parsed rules, crawl delay, and sitemap URLs. Useful for respecting website crawling policies and understanding access restrictions.',
  inputSchema: jsonSchema<RobotsPolicyInput>({
    type: 'object',
    properties: {
      robotsUrl: {
        type: 'string',
        description: 'The robots.txt URL to parse (usually https://example.com/robots.txt)',
      },
      testUrl: {
        type: 'string',
        description: 'The full URL to test for crawl permission',
      },
      userAgent: {
        type: 'string',
        description:
          'The user agent to check permissions for (default: "*" for all bots). Common values: "googlebot", "bingbot", "*"',
        default: '*',
      },
    },
    required: ['robotsUrl', 'testUrl'],
    additionalProperties: false,
  }),
  async execute({ robotsUrl, testUrl, userAgent = '*' }): Promise<RobotsPolicy> {
    // Validate URLs
    if (!robotsUrl || typeof robotsUrl !== 'string') {
      throw new Error('robotsUrl is required and must be a string');
    }

    if (!isValidUrl(robotsUrl)) {
      throw new Error(`Invalid robotsUrl: ${robotsUrl}. Must be a valid http or https URL.`);
    }

    if (!testUrl || typeof testUrl !== 'string') {
      throw new Error('testUrl is required and must be a string');
    }

    if (!isValidUrl(testUrl)) {
      throw new Error(`Invalid testUrl: ${testUrl}. Must be a valid http or https URL.`);
    }

    // Validate that testUrl is from the same domain as robotsUrl
    const robotsUrlObj = new URL(robotsUrl);
    const testUrlObj = new URL(testUrl);

    if (robotsUrlObj.origin !== testUrlObj.origin) {
      throw new Error(
        `testUrl must be from the same domain as robotsUrl. robotsUrl domain: ${robotsUrlObj.origin}, testUrl domain: ${testUrlObj.origin}`
      );
    }

    // Fetch robots.txt
    let robotsTxt: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TPMJSBot/1.0; +https://tpmjs.com)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        // No robots.txt means everything is allowed
        return {
          allowed: true,
          userAgent,
          testUrl,
          rules: [],
          sitemaps: [],
          metadata: {
            fetchedAt: new Date().toISOString(),
            robotsUrl,
            hasRules: false,
          },
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      robotsTxt = await response.text();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request to ${robotsUrl} timed out after 30 seconds`);
        }
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          throw new Error(`DNS resolution failed for ${robotsUrl}. Check the domain name.`);
        }
        throw new Error(`Failed to fetch robots.txt from ${robotsUrl}: ${error.message}`);
      }
      throw new Error(`Failed to fetch robots.txt from ${robotsUrl}: Unknown network error`);
    }

    // Parse robots.txt
    const { rules, globalSitemaps } = parseRobotsTxt(robotsTxt);

    // Check if URL is allowed
    const { allowed, matchedRule, crawlDelay } = findMatchingRule(rules, userAgent, testUrl);

    return {
      allowed,
      userAgent,
      testUrl,
      matchedRule,
      rules,
      crawlDelay,
      sitemaps: globalSitemaps,
      metadata: {
        fetchedAt: new Date().toISOString(),
        robotsUrl,
        hasRules: rules.length > 0,
      },
    };
  },
});

export default robotsPolicyTool;

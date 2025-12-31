/**
 * Web Security Hardening Checklist Tool for TPMJS
 * Generates a comprehensive security hardening checklist based on configuration.
 * Evaluates security posture and provides actionable recommendations.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Checklist item with status and priority
 */
export interface ChecklistItem {
  category: string;
  item: string;
  status: 'implemented' | 'missing' | 'partial';
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
}

/**
 * Output interface for hardening checklist
 */
export interface HardeningChecklistResult {
  checklist: ChecklistItem[];
  score: number;
  maxScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
  summary: {
    implemented: number;
    missing: number;
    partial: number;
    critical: number;
    high: number;
  };
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  https?: boolean;
  hsts?: boolean;
  csp?: boolean;
  cors?: boolean;
  xFrameOptions?: boolean;
  xContentTypeOptions?: boolean;
  referrerPolicy?: boolean;
  permissionsPolicy?: boolean;
  sri?: boolean;
  cookieSecure?: boolean;
  cookieHttpOnly?: boolean;
  cookieSameSite?: boolean;
  inputValidation?: boolean;
  outputEncoding?: boolean;
  sqlParameterized?: boolean;
  authenticationMFA?: boolean;
  sessionManagement?: boolean;
  rateLimiting?: boolean;
  logging?: boolean;
  errorHandling?: boolean;
  dependencyScanning?: boolean;
  secretsManagement?: boolean;
}

type HardeningChecklistInput = {
  config: SecurityConfig;
};

/**
 * Security checklist item definitions
 */
const SECURITY_ITEMS: Array<{
  key: keyof SecurityConfig;
  category: string;
  item: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  points: number;
}> = [
  {
    key: 'https',
    category: 'Transport Security',
    item: 'HTTPS enabled for all connections',
    priority: 'critical',
    impact: 'Prevents man-in-the-middle attacks and data interception',
    points: 10,
  },
  {
    key: 'hsts',
    category: 'Transport Security',
    item: 'HTTP Strict Transport Security (HSTS) header configured',
    priority: 'high',
    impact: 'Forces browsers to use HTTPS and prevents protocol downgrade attacks',
    points: 8,
  },
  {
    key: 'csp',
    category: 'Headers',
    item: 'Content Security Policy (CSP) implemented',
    priority: 'critical',
    impact: 'Mitigates XSS attacks by controlling resource loading',
    points: 10,
  },
  {
    key: 'cors',
    category: 'Headers',
    item: 'CORS policy properly configured',
    priority: 'high',
    impact: 'Prevents unauthorized cross-origin requests',
    points: 7,
  },
  {
    key: 'xFrameOptions',
    category: 'Headers',
    item: 'X-Frame-Options header set (clickjacking protection)',
    priority: 'high',
    impact: 'Prevents clickjacking attacks',
    points: 6,
  },
  {
    key: 'xContentTypeOptions',
    category: 'Headers',
    item: 'X-Content-Type-Options: nosniff configured',
    priority: 'medium',
    impact: 'Prevents MIME type sniffing vulnerabilities',
    points: 5,
  },
  {
    key: 'referrerPolicy',
    category: 'Headers',
    item: 'Referrer-Policy header configured',
    priority: 'medium',
    impact: 'Controls referrer information disclosure',
    points: 4,
  },
  {
    key: 'permissionsPolicy',
    category: 'Headers',
    item: 'Permissions-Policy header set',
    priority: 'medium',
    impact: 'Controls browser features and APIs available to the page',
    points: 5,
  },
  {
    key: 'sri',
    category: 'Resource Integrity',
    item: 'Subresource Integrity (SRI) for external scripts/styles',
    priority: 'high',
    impact: 'Ensures external resources have not been tampered with',
    points: 7,
  },
  {
    key: 'cookieSecure',
    category: 'Cookies',
    item: 'Secure flag set on all cookies',
    priority: 'critical',
    impact: 'Ensures cookies are only sent over HTTPS',
    points: 8,
  },
  {
    key: 'cookieHttpOnly',
    category: 'Cookies',
    item: 'HttpOnly flag set on session cookies',
    priority: 'critical',
    impact: 'Prevents JavaScript access to cookies, mitigating XSS cookie theft',
    points: 9,
  },
  {
    key: 'cookieSameSite',
    category: 'Cookies',
    item: 'SameSite attribute configured on cookies',
    priority: 'high',
    impact: 'Prevents CSRF attacks',
    points: 8,
  },
  {
    key: 'inputValidation',
    category: 'Input Security',
    item: 'Server-side input validation implemented',
    priority: 'critical',
    impact: 'Prevents injection attacks and malicious input',
    points: 10,
  },
  {
    key: 'outputEncoding',
    category: 'Output Security',
    item: 'Output encoding/escaping for all user content',
    priority: 'critical',
    impact: 'Prevents XSS attacks',
    points: 10,
  },
  {
    key: 'sqlParameterized',
    category: 'Database Security',
    item: 'Parameterized queries/prepared statements for database access',
    priority: 'critical',
    impact: 'Prevents SQL injection attacks',
    points: 10,
  },
  {
    key: 'authenticationMFA',
    category: 'Authentication',
    item: 'Multi-factor authentication (MFA) available',
    priority: 'high',
    impact: 'Significantly reduces account compromise risk',
    points: 8,
  },
  {
    key: 'sessionManagement',
    category: 'Session Security',
    item: 'Secure session management (timeouts, regeneration)',
    priority: 'critical',
    impact: 'Prevents session hijacking and fixation attacks',
    points: 9,
  },
  {
    key: 'rateLimiting',
    category: 'API Security',
    item: 'Rate limiting on API endpoints',
    priority: 'high',
    impact: 'Prevents brute force and DoS attacks',
    points: 7,
  },
  {
    key: 'logging',
    category: 'Monitoring',
    item: 'Security event logging and monitoring',
    priority: 'high',
    impact: 'Enables detection and response to security incidents',
    points: 7,
  },
  {
    key: 'errorHandling',
    category: 'Error Handling',
    item: 'Secure error handling (no sensitive info in errors)',
    priority: 'medium',
    impact: 'Prevents information disclosure',
    points: 6,
  },
  {
    key: 'dependencyScanning',
    category: 'Supply Chain',
    item: 'Dependency vulnerability scanning',
    priority: 'high',
    impact: 'Identifies vulnerable third-party libraries',
    points: 7,
  },
  {
    key: 'secretsManagement',
    category: 'Secrets',
    item: 'Secure secrets management (no hardcoded credentials)',
    priority: 'critical',
    impact: 'Prevents credential exposure',
    points: 9,
  },
];

/**
 * Calculate security score grade
 */
function calculateGrade(percentage: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 55) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

/**
 * Generate recommendations based on missing items
 */
function generateRecommendations(checklist: ChecklistItem[]): string[] {
  const recommendations: string[] = [];

  // Get missing critical items first
  const missingCritical = checklist.filter(
    (item) => item.status === 'missing' && item.priority === 'critical'
  );

  if (missingCritical.length > 0) {
    recommendations.push(
      `URGENT: ${missingCritical.length} critical security controls are missing. Address these immediately:`
    );
    for (const item of missingCritical.slice(0, 3)) {
      recommendations.push(`  - ${item.item}: ${item.impact}`);
    }
  }

  // Get missing high priority items
  const missingHigh = checklist.filter(
    (item) => item.status === 'missing' && item.priority === 'high'
  );

  if (missingHigh.length > 0) {
    recommendations.push(
      `Implement ${missingHigh.length} high-priority security controls to significantly improve security posture`
    );
  }

  // Category-specific recommendations
  const missingByCategory = new Map<string, number>();
  for (const item of checklist) {
    if (item.status === 'missing') {
      missingByCategory.set(item.category, (missingByCategory.get(item.category) || 0) + 1);
    }
  }

  for (const [category, count] of missingByCategory.entries()) {
    if (count >= 2) {
      recommendations.push(`Focus on improving ${category} - ${count} items need attention`);
    }
  }

  // General recommendations based on score
  const implementedCount = checklist.filter((item) => item.status === 'implemented').length;
  const totalCount = checklist.length;
  const percentage = (implementedCount / totalCount) * 100;

  if (percentage < 50) {
    recommendations.push(
      'Security posture is weak. Consider conducting a comprehensive security audit.'
    );
  } else if (percentage < 80) {
    recommendations.push(
      'Good progress on security hardening. Focus on implementing remaining controls.'
    );
  } else if (percentage >= 95) {
    recommendations.push(
      'Excellent security posture! Maintain controls and stay updated on new threats.'
    );
  }

  return recommendations;
}

/**
 * Web Security Hardening Checklist Tool
 * Generates a comprehensive security checklist based on configuration
 */
export const hardeningChecklistWebTool = tool({
  description:
    'Generate a web security hardening checklist based on your current security configuration. Evaluates implemented security controls, calculates a security score, and provides prioritized recommendations for improvement. Covers transport security, headers, cookies, input/output security, authentication, and more.',
  inputSchema: jsonSchema<HardeningChecklistInput>({
    type: 'object',
    properties: {
      config: {
        type: 'object',
        description:
          'Security configuration object with boolean flags for various security features. Omitted properties default to false.',
        properties: {
          https: { type: 'boolean', description: 'HTTPS enabled' },
          hsts: { type: 'boolean', description: 'HSTS header configured' },
          csp: { type: 'boolean', description: 'Content Security Policy implemented' },
          cors: { type: 'boolean', description: 'CORS policy configured' },
          xFrameOptions: { type: 'boolean', description: 'X-Frame-Options header set' },
          xContentTypeOptions: {
            type: 'boolean',
            description: 'X-Content-Type-Options header set',
          },
          referrerPolicy: { type: 'boolean', description: 'Referrer-Policy configured' },
          permissionsPolicy: { type: 'boolean', description: 'Permissions-Policy configured' },
          sri: { type: 'boolean', description: 'Subresource Integrity implemented' },
          cookieSecure: { type: 'boolean', description: 'Secure flag on cookies' },
          cookieHttpOnly: { type: 'boolean', description: 'HttpOnly flag on cookies' },
          cookieSameSite: { type: 'boolean', description: 'SameSite attribute on cookies' },
          inputValidation: { type: 'boolean', description: 'Input validation implemented' },
          outputEncoding: { type: 'boolean', description: 'Output encoding implemented' },
          sqlParameterized: {
            type: 'boolean',
            description: 'Parameterized queries used',
          },
          authenticationMFA: { type: 'boolean', description: 'MFA available' },
          sessionManagement: {
            type: 'boolean',
            description: 'Secure session management',
          },
          rateLimiting: { type: 'boolean', description: 'Rate limiting implemented' },
          logging: { type: 'boolean', description: 'Security logging enabled' },
          errorHandling: { type: 'boolean', description: 'Secure error handling' },
          dependencyScanning: {
            type: 'boolean',
            description: 'Dependency scanning enabled',
          },
          secretsManagement: {
            type: 'boolean',
            description: 'Secrets management implemented',
          },
        },
        additionalProperties: false,
      },
    },
    required: ['config'],
    additionalProperties: false,
  }),
  async execute({ config }): Promise<HardeningChecklistResult> {
    // Validate input
    if (!config || typeof config !== 'object') {
      throw new Error('Config must be an object with security feature flags');
    }

    // Build checklist
    const checklist: ChecklistItem[] = [];
    let score = 0;
    let maxScore = 0;

    const summary = {
      implemented: 0,
      missing: 0,
      partial: 0,
      critical: 0,
      high: 0,
    };

    for (const item of SECURITY_ITEMS) {
      const implemented = config[item.key] === true;
      const status = implemented ? 'implemented' : 'missing';

      if (status === 'implemented') {
        score += item.points;
        summary.implemented++;
      } else {
        summary.missing++;
        if (item.priority === 'critical') {
          summary.critical++;
        } else if (item.priority === 'high') {
          summary.high++;
        }
      }

      maxScore += item.points;

      checklist.push({
        category: item.category,
        item: item.item,
        status,
        priority: item.priority,
        impact: item.impact,
      });
    }

    // Calculate percentage and grade
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const grade = calculateGrade(percentage);

    // Generate recommendations
    const recommendations = generateRecommendations(checklist);

    return {
      checklist,
      score,
      maxScore,
      percentage,
      grade,
      recommendations,
      summary,
    };
  },
});

export default hardeningChecklistWebTool;

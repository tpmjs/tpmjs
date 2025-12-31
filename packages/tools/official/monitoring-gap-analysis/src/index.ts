/**
 * Monitoring Gap Analysis Tool for TPMJS
 * Analyzes monitoring coverage across services to identify gaps in metrics, alerts, and logs.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input service definition
 */
export interface ServiceInput {
  name: string;
  hasMetrics: boolean;
  hasAlerts: boolean;
  hasLogs: boolean;
}

/**
 * Gap type enumeration
 */
export type GapType = 'metrics' | 'alerts' | 'logs' | 'critical';

/**
 * Identified monitoring gap
 */
export interface MonitoringGap {
  service: string;
  gapType: GapType;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  impact: string;
}

/**
 * Recommendation for addressing gaps
 */
export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'metrics' | 'alerts' | 'logs' | 'infrastructure';
  title: string;
  description: string;
  affectedServices: string[];
}

/**
 * Output interface for monitoring gap analysis
 */
export interface MonitoringGapAnalysis {
  gaps: MonitoringGap[];
  recommendations: Recommendation[];
  coverageScore: number; // 0-100
  summary: string;
  metadata: {
    totalServices: number;
    servicesWithGaps: number;
    criticalGaps: number;
    analyzedAt: string;
    coverageBreakdown: {
      metrics: number; // percentage
      alerts: number; // percentage
      logs: number; // percentage
    };
  };
}

type MonitoringGapAnalysisInput = {
  services: ServiceInput[];
};

/**
 * Identifies gaps for a single service
 */
function identifyServiceGaps(service: ServiceInput): MonitoringGap[] {
  const gaps: MonitoringGap[] = [];

  // Check for completely unmonitored services (critical)
  if (!service.hasMetrics && !service.hasAlerts && !service.hasLogs) {
    gaps.push({
      service: service.name,
      gapType: 'critical',
      severity: 'critical',
      description: 'Service has no monitoring coverage',
      impact:
        'Cannot detect outages, performance issues, or errors. Service failures will only be discovered through user reports.',
    });
    return gaps; // Return early for critical case
  }

  // Check for missing metrics
  if (!service.hasMetrics) {
    gaps.push({
      service: service.name,
      gapType: 'metrics',
      severity: service.hasAlerts || service.hasLogs ? 'high' : 'critical',
      description: 'Missing metrics collection',
      impact:
        'Cannot track performance trends, capacity, or establish baselines. Limited ability to perform root cause analysis.',
    });
  }

  // Check for missing alerts
  if (!service.hasAlerts) {
    gaps.push({
      service: service.name,
      gapType: 'alerts',
      severity: service.hasMetrics ? 'high' : 'critical',
      description: 'Missing alerting configuration',
      impact:
        'Issues must be discovered manually through dashboard review. Increases mean time to detection (MTTD) and resolution (MTTR).',
    });
  }

  // Check for missing logs
  if (!service.hasLogs) {
    gaps.push({
      service: service.name,
      gapType: 'logs',
      severity: 'medium',
      description: 'Missing log collection',
      impact:
        'Difficult to debug issues and perform detailed root cause analysis. Cannot correlate events across services.',
    });
  }

  return gaps;
}

/**
 * Generates recommendations based on identified gaps
 */
function generateRecommendations(
  gaps: MonitoringGap[],
  services: ServiceInput[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Group gaps by type
  const metricGaps = gaps.filter((g) => g.gapType === 'metrics' || g.gapType === 'critical');
  const alertGaps = gaps.filter((g) => g.gapType === 'alerts' || g.gapType === 'critical');
  const logGaps = gaps.filter((g) => g.gapType === 'logs');

  // Recommendation for metrics gaps
  if (metricGaps.length > 0) {
    const criticalServices = metricGaps.filter((g) => g.severity === 'critical');
    recommendations.push({
      priority: criticalServices.length > 0 ? 'high' : 'medium',
      category: 'metrics',
      title: 'Implement metrics collection for unmonitored services',
      description:
        'Deploy metric exporters (Prometheus, StatsD, CloudWatch) to collect core metrics: request rate, error rate, latency (RED), and saturation. Focus on golden signals for service health.',
      affectedServices: metricGaps.map((g) => g.service),
    });
  }

  // Recommendation for alert gaps
  if (alertGaps.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'alerts',
      title: 'Configure alerting for critical service metrics',
      description:
        'Set up alerts for key indicators: high error rates (>1%), elevated latency (P99 > threshold), and traffic anomalies. Implement multi-window burn rate alerts for SLO violations.',
      affectedServices: alertGaps.map((g) => g.service),
    });
  }

  // Recommendation for log gaps
  if (logGaps.length > 0) {
    recommendations.push({
      priority: logGaps.length > services.length / 2 ? 'high' : 'medium',
      category: 'logs',
      title: 'Enable structured logging and centralized collection',
      description:
        'Implement structured logging (JSON format) with correlation IDs. Forward logs to centralized system (Elasticsearch, Loki, CloudWatch Logs) for search and analysis.',
      affectedServices: logGaps.map((g) => g.service),
    });
  }

  // Check for services with partial monitoring (need comprehensive coverage)
  const partiallyMonitored = services.filter(
    (s) => (s.hasMetrics || s.hasAlerts || s.hasLogs) && !(s.hasMetrics && s.hasAlerts && s.hasLogs)
  );

  if (partiallyMonitored.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'infrastructure',
      title: 'Achieve comprehensive monitoring coverage',
      description:
        'Services with partial monitoring should be upgraded to full observability stack (metrics + alerts + logs) for complete visibility and faster incident response.',
      affectedServices: partiallyMonitored.map((s) => s.name),
    });
  }

  // Check if majority of services lack monitoring (infrastructure recommendation)
  const unmonitoredCount = services.filter(
    (s) => !s.hasMetrics && !s.hasAlerts && !s.hasLogs
  ).length;

  if (unmonitoredCount > services.length / 2) {
    recommendations.unshift({
      priority: 'high',
      category: 'infrastructure',
      title: 'Establish observability infrastructure',
      description:
        'Deploy core observability platform (e.g., Prometheus + Grafana + Loki, or Datadog/New Relic) before instrumenting individual services. This provides consistent tooling and reduces setup time per service.',
      affectedServices: ['All services'],
    });
  }

  // Sort recommendations by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Calculates coverage score (0-100) based on services with complete monitoring
 */
function calculateCoverageScore(services: ServiceInput[]): number {
  if (services.length === 0) return 0;

  let totalPoints = 0;
  const maxPointsPerService = 3; // metrics + alerts + logs

  for (const service of services) {
    if (service.hasMetrics) totalPoints += 1;
    if (service.hasAlerts) totalPoints += 1;
    if (service.hasLogs) totalPoints += 1;
  }

  const maxPoints = services.length * maxPointsPerService;
  return Math.round((totalPoints / maxPoints) * 100);
}

/**
 * Calculates coverage breakdown by monitoring type
 */
function calculateCoverageBreakdown(services: ServiceInput[]): {
  metrics: number;
  alerts: number;
  logs: number;
} {
  if (services.length === 0) {
    return { metrics: 0, alerts: 0, logs: 0 };
  }

  const metricsCount = services.filter((s) => s.hasMetrics).length;
  const alertsCount = services.filter((s) => s.hasAlerts).length;
  const logsCount = services.filter((s) => s.hasLogs).length;

  return {
    metrics: Math.round((metricsCount / services.length) * 100),
    alerts: Math.round((alertsCount / services.length) * 100),
    logs: Math.round((logsCount / services.length) * 100),
  };
}

/**
 * Generates summary text
 */
function generateSummary(
  services: ServiceInput[],
  gaps: MonitoringGap[],
  coverageScore: number
): string {
  const servicesWithGaps = new Set(gaps.map((g) => g.service)).size;
  const criticalGaps = gaps.filter((g) => g.severity === 'critical').length;

  let summary = `Analyzed ${services.length} service${services.length !== 1 ? 's' : ''} with ${coverageScore}% overall monitoring coverage. `;

  if (servicesWithGaps === 0) {
    summary += 'All services have complete monitoring coverage (metrics, alerts, and logs).';
    return summary;
  }

  summary += `Found ${gaps.length} gap${gaps.length !== 1 ? 's' : ''} across ${servicesWithGaps} service${servicesWithGaps !== 1 ? 's' : ''}`;

  if (criticalGaps > 0) {
    summary += `, including ${criticalGaps} critical gap${criticalGaps !== 1 ? 's' : ''} requiring immediate attention`;
  }

  summary += '. ';

  // Add coverage assessment
  if (coverageScore >= 80) {
    summary +=
      'Monitoring coverage is good, but gaps should be addressed to achieve full observability.';
  } else if (coverageScore >= 50) {
    summary +=
      'Monitoring coverage is moderate. Prioritize addressing critical gaps and expanding coverage.';
  } else {
    summary +=
      'Monitoring coverage is insufficient. Immediate action required to establish baseline observability.';
  }

  return summary;
}

/**
 * Monitoring Gap Analysis Tool
 * Analyzes monitoring coverage across services
 */
export const monitoringGapAnalysisTool = tool({
  description:
    'Analyze monitoring coverage gaps across services and endpoints. Provide a list of services with their current monitoring status (metrics, alerts, logs) to identify gaps, receive prioritized recommendations, and calculate an overall coverage score. Useful for SRE teams assessing observability maturity.',
  inputSchema: jsonSchema<MonitoringGapAnalysisInput>({
    type: 'object',
    properties: {
      services: {
        type: 'array',
        description: 'Array of services to analyze with their monitoring coverage status',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Service name (e.g., "API Gateway", "Payment Service")',
            },
            hasMetrics: {
              type: 'boolean',
              description: 'Whether the service has metrics collection configured',
            },
            hasAlerts: {
              type: 'boolean',
              description: 'Whether the service has alerting configured',
            },
            hasLogs: {
              type: 'boolean',
              description: 'Whether the service has log collection configured',
            },
          },
          required: ['name', 'hasMetrics', 'hasAlerts', 'hasLogs'],
        },
      },
    },
    required: ['services'],
    additionalProperties: false,
  }),
  async execute({ services }): Promise<MonitoringGapAnalysis> {
    // Validate input
    if (!Array.isArray(services)) {
      throw new Error('Services must be an array');
    }

    if (services.length === 0) {
      throw new Error('Services array must contain at least one service');
    }

    // Validate each service
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      if (!service) {
        throw new Error(`Service at index ${i}: is undefined`);
      }

      if (!service.name || typeof service.name !== 'string' || service.name.trim().length === 0) {
        throw new Error(`Service at index ${i}: name is required and must be a non-empty string`);
      }

      if (typeof service.hasMetrics !== 'boolean') {
        throw new Error(`Service at index ${i}: hasMetrics must be a boolean`);
      }

      if (typeof service.hasAlerts !== 'boolean') {
        throw new Error(`Service at index ${i}: hasAlerts must be a boolean`);
      }

      if (typeof service.hasLogs !== 'boolean') {
        throw new Error(`Service at index ${i}: hasLogs must be a boolean`);
      }
    }

    // Normalize service names
    const normalizedServices = services.map((s) => ({
      ...s,
      name: s.name.trim(),
    }));

    // Identify gaps for each service
    const allGaps: MonitoringGap[] = [];
    for (const service of normalizedServices) {
      const serviceGaps = identifyServiceGaps(service);
      allGaps.push(...serviceGaps);
    }

    // Generate recommendations
    const recommendations = generateRecommendations(allGaps, normalizedServices);

    // Calculate coverage metrics
    const coverageScore = calculateCoverageScore(normalizedServices);
    const coverageBreakdown = calculateCoverageBreakdown(normalizedServices);

    // Generate summary
    const summary = generateSummary(normalizedServices, allGaps, coverageScore);

    // Calculate metadata
    const servicesWithGaps = new Set(allGaps.map((g) => g.service)).size;
    const criticalGaps = allGaps.filter((g) => g.severity === 'critical').length;

    return {
      gaps: allGaps,
      recommendations,
      coverageScore,
      summary,
      metadata: {
        totalServices: normalizedServices.length,
        servicesWithGaps,
        criticalGaps,
        analyzedAt: new Date().toISOString(),
        coverageBreakdown,
      },
    };
  },
});

export default monitoringGapAnalysisTool;

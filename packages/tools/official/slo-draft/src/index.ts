/**
 * SLO Draft Tool for TPMJS
 * Drafts Service Level Objective (SLO) definitions for services with metrics, targets, and time windows.
 *
 * Domain rule: slo-definition - Generates SLO/SLI definitions with burn rate alerting and error budgets
 * Domain rule: monitoring-query-generation - Creates Prometheus-compatible monitoring queries for metrics
 * Domain rule: severity-classification - Classifies metrics by severity based on target percentages (99.9%+ = critical)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input metric definition
 */
export interface MetricInput {
  name: string;
  target: number;
  window: string;
}

/**
 * Processed metric with additional metadata
 */
export interface ProcessedMetric {
  name: string;
  target: number;
  window: string;
  windowType: 'rolling' | 'calendar';
  severity: 'critical' | 'high' | 'medium';
}

/**
 * SLI (Service Level Indicator) definition
 */
export interface SLI {
  name: string;
  description: string;
  query: string;
  unit: string;
}

/**
 * Target definition with thresholds
 */
export interface Target {
  sliName: string;
  target: number;
  window: string;
  windowType: 'rolling' | 'calendar';
}

/**
 * Alert configuration with burn rate
 */
export interface Alert {
  sliName: string;
  severity: 'critical' | 'high' | 'medium';
  burnRateWindow: string;
  burnRateThreshold: number;
  notificationChannels: string[];
}

/**
 * Output interface for SLO draft
 */
export interface SLODraft {
  slis: SLI[];
  targets: Target[];
  alerts: Alert[];
  rationale: string;
}

type SLODraftInput = {
  serviceDesc: string;
  metrics: MetricInput[];
};

/**
 * Determines the window type based on the window string
 */
function determineWindowType(window: string): 'rolling' | 'calendar' {
  const lowerWindow = window.toLowerCase();
  if (lowerWindow.includes('calendar') || lowerWindow.includes('month')) {
    return 'calendar';
  }
  return 'rolling';
}

/**
 * Determines severity based on target percentage
 * Higher targets = more critical
 */
function determineSeverity(target: number): 'critical' | 'high' | 'medium' {
  if (target >= 99.9) return 'critical';
  if (target >= 99.0) return 'high';
  return 'medium';
}

/**
 * Generates SLI definition from metric
 */
function generateSLI(metric: ProcessedMetric): SLI {
  const lowerName = metric.name.toLowerCase();
  let description = '';
  let query = '';
  let unit = '';

  if (lowerName.includes('availability') || lowerName.includes('uptime')) {
    description = 'Measures the proportion of successful requests over total requests';
    query =
      'sum(rate(http_requests_total{status=~"2.."}[5m])) / sum(rate(http_requests_total[5m]))';
    unit = 'percentage';
  } else if (lowerName.includes('latency') || lowerName.includes('response')) {
    description = 'Measures the proportion of requests completing within latency threshold';
    query = 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))';
    unit = 'percentage';
  } else if (lowerName.includes('error') || lowerName.includes('success')) {
    description = 'Measures the proportion of successful requests (non-error responses)';
    query =
      'sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))';
    unit = 'percentage';
  } else {
    description = `Measures ${metric.name} performance over time`;
    query = `rate(${metric.name.toLowerCase().replace(/\s+/g, '_')}_total[5m])`;
    unit = 'percentage';
  }

  return {
    name: metric.name,
    description,
    query,
    unit,
  };
}

/**
 * Generates alert configuration from metric
 */
function generateAlert(metric: ProcessedMetric): Alert {
  let burnRateWindow = '';
  let burnRateThreshold = 0;
  let notificationChannels: string[] = [];

  if (metric.severity === 'critical') {
    burnRateWindow = '1h';
    burnRateThreshold = 14.4; // Will exhaust error budget in ~2 hours
    notificationChannels = ['pagerduty', 'slack-incidents'];
  } else if (metric.severity === 'high') {
    burnRateWindow = '6h';
    burnRateThreshold = 6.0; // Will exhaust error budget in ~24 hours
    notificationChannels = ['slack-incidents'];
  } else {
    burnRateWindow = '3d';
    burnRateThreshold = 1.0; // Will exhaust error budget in ~7 days
    notificationChannels = ['slack-alerts'];
  }

  return {
    sliName: metric.name,
    severity: metric.severity,
    burnRateWindow,
    burnRateThreshold,
    notificationChannels,
  };
}

/**
 * Creates rationale for SLO choices
 */
function createRationale(serviceDesc: string, metrics: ProcessedMetric[]): string {
  const criticalCount = metrics.filter((m) => m.severity === 'critical').length;
  const highCount = metrics.filter((m) => m.severity === 'high').length;
  const mediumCount = metrics.filter((m) => m.severity === 'medium').length;

  let rationale = `This SLO draft for ${serviceDesc} defines ${metrics.length} measurable service level indicator${metrics.length !== 1 ? 's' : ''} `;
  rationale += `(${criticalCount} critical, ${highCount} high, ${mediumCount} medium severity). `;

  rationale += 'Each SLI is designed to be measurable using standard monitoring queries. ';
  rationale += 'Targets are set based on industry best practices and error budget principles. ';

  const highestTarget = Math.max(...metrics.map((m) => m.target));
  if (highestTarget >= 99.9) {
    rationale +=
      'The stringent targets (99.9%+) reflect mission-critical service requirements and necessitate robust monitoring, alerting, and incident response processes. ';
  } else if (highestTarget >= 99.0) {
    rationale +=
      'The targets (99.0%+) balance reliability with operational flexibility, allowing for planned maintenance and gradual improvements. ';
  } else {
    rationale +=
      'The targets are set to be achievable while driving continuous improvement in service quality. ';
  }

  rationale +=
    'Burn rate alerting ensures early detection of SLO violations before error budgets are exhausted, enabling proactive remediation.';

  return rationale;
}

/**
 * SLO Draft Tool
 * Generates a comprehensive SLO document for a service
 */
export const sloDraftTool = tool({
  description:
    'Draft Service Level Objective (SLO) definitions for a service. Provide the service description and metrics (with name, target percentage, and time window) to generate a comprehensive SLO document in markdown format with error budgets, alerting strategies, and monitoring recommendations.',
  inputSchema: jsonSchema<SLODraftInput>({
    type: 'object',
    properties: {
      serviceDesc: {
        type: 'string',
        description: 'Description of the service (e.g., "API Gateway", "Payment Service")',
      },
      metrics: {
        type: 'array',
        description:
          'Array of SLO metrics with name, target (percentage), and window (e.g., "30d", "7d")',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Metric name (e.g., "Availability", "API Latency P99")',
            },
            target: {
              type: 'number',
              description: 'Target percentage (e.g., 99.9 for 99.9%). Must be between 0 and 100.',
              minimum: 0,
              maximum: 100,
            },
            window: {
              type: 'string',
              description: 'Time window for measurement (e.g., "30d", "7 days", "rolling 30 days")',
            },
          },
          required: ['name', 'target', 'window'],
        },
      },
    },
    required: ['serviceDesc', 'metrics'],
    additionalProperties: false,
  }),
  async execute({ serviceDesc, metrics }): Promise<SLODraft> {
    // Validate inputs
    if (!serviceDesc || typeof serviceDesc !== 'string' || serviceDesc.trim().length === 0) {
      throw new Error('Service description is required and must be a non-empty string');
    }

    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new Error('Metrics array is required and must contain at least one metric');
    }

    // Validate and process each metric
    const processedMetrics: ProcessedMetric[] = [];

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      if (!metric) {
        throw new Error(`Metric at index ${i}: is undefined`);
      }

      if (!metric.name || typeof metric.name !== 'string' || metric.name.trim().length === 0) {
        throw new Error(`Metric at index ${i}: name is required and must be a non-empty string`);
      }

      if (typeof metric.target !== 'number') {
        throw new Error(`Metric at index ${i}: target must be a number`);
      }

      if (metric.target < 0 || metric.target > 100) {
        throw new Error(`Metric at index ${i}: target must be between 0 and 100`);
      }

      if (
        !metric.window ||
        typeof metric.window !== 'string' ||
        metric.window.trim().length === 0
      ) {
        throw new Error(`Metric at index ${i}: window is required and must be a non-empty string`);
      }

      processedMetrics.push({
        name: metric.name.trim(),
        target: metric.target,
        window: metric.window.trim(),
        windowType: determineWindowType(metric.window),
        severity: determineSeverity(metric.target),
      });
    }

    // Sort metrics by severity (critical first)
    processedMetrics.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Generate SLIs, targets, and alerts
    const slis: SLI[] = processedMetrics.map(generateSLI);
    const targets: Target[] = processedMetrics.map((metric) => ({
      sliName: metric.name,
      target: metric.target,
      window: metric.window,
      windowType: metric.windowType,
    }));
    const alerts: Alert[] = processedMetrics.map(generateAlert);
    const rationale = createRationale(serviceDesc.trim(), processedMetrics);

    return {
      slis,
      targets,
      alerts,
      rationale,
    };
  },
});

export default sloDraftTool;

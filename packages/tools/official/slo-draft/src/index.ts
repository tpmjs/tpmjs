/**
 * SLO Draft Tool for TPMJS
 * Drafts Service Level Objective (SLO) definitions for services with metrics, targets, and time windows.
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
 * Output interface for SLO draft
 */
export interface SLODraft {
  slo: string; // Markdown formatted SLO document
  metrics: ProcessedMetric[];
  summary: string;
  metadata: {
    serviceName: string;
    createdAt: string;
    totalMetrics: number;
    criticalMetrics: number;
  };
}

type SLODraftInput = {
  serviceName: string;
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
 * Calculates allowed downtime based on target and window
 */
function calculateAllowedDowntime(target: number, window: string): string {
  const lowerWindow = window.toLowerCase();
  let totalMinutes = 0;

  // Parse window to get total minutes
  if (lowerWindow.includes('30d') || lowerWindow.includes('30 day')) {
    totalMinutes = 30 * 24 * 60;
  } else if (lowerWindow.includes('7d') || lowerWindow.includes('7 day')) {
    totalMinutes = 7 * 24 * 60;
  } else if (lowerWindow.includes('1d') || lowerWindow.includes('1 day')) {
    totalMinutes = 24 * 60;
  } else if (lowerWindow.includes('month')) {
    totalMinutes = 30 * 24 * 60; // Approximate
  } else {
    // Default to 30 days if unparseable
    totalMinutes = 30 * 24 * 60;
  }

  const uptimePercentage = target / 100;
  const allowedDowntimeMinutes = totalMinutes * (1 - uptimePercentage);

  // Format as hours/minutes
  const hours = Math.floor(allowedDowntimeMinutes / 60);
  const minutes = Math.floor(allowedDowntimeMinutes % 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Generates markdown SLO document
 */
function generateSLOMarkdown(serviceName: string, metrics: ProcessedMetric[]): string {
  const timestamp = new Date().toISOString().split('T')[0];

  let markdown = '# Service Level Objectives (SLO)\n\n';
  markdown += `**Service:** ${serviceName}\n`;
  markdown += `**Date:** ${timestamp}\n`;
  markdown += '**Status:** Draft\n\n';

  markdown += '## Overview\n\n';
  markdown += `This document defines the Service Level Objectives (SLOs) for ${serviceName}. `;
  markdown +=
    'These objectives represent the target reliability and performance metrics that the service commits to achieving.\n\n';

  markdown += '## SLO Definitions\n\n';

  for (const metric of metrics) {
    const downtime = calculateAllowedDowntime(metric.target, metric.window);
    const icon = metric.severity === 'critical' ? '🔴' : metric.severity === 'high' ? '🟡' : '🟢';

    markdown += `### ${icon} ${metric.name}\n\n`;
    markdown += `- **Target:** ${metric.target}%\n`;
    markdown += `- **Window:** ${metric.window} (${metric.windowType})\n`;
    markdown += `- **Severity:** ${metric.severity}\n`;
    markdown += `- **Allowed Downtime:** ${downtime}\n\n`;
    markdown += '**Description:** ';

    // Add contextual description based on metric name
    const lowerName = metric.name.toLowerCase();
    if (lowerName.includes('availability') || lowerName.includes('uptime')) {
      markdown += `The service must be available and responding to requests ${metric.target}% of the time within the ${metric.window} window. `;
    } else if (lowerName.includes('latency') || lowerName.includes('response')) {
      markdown += `${metric.target}% of requests must complete within the defined latency threshold during the ${metric.window} window. `;
    } else if (lowerName.includes('error') || lowerName.includes('success')) {
      markdown += `The error rate must remain below ${100 - metric.target}% (success rate above ${metric.target}%) within the ${metric.window} window. `;
    } else {
      markdown += `This metric must achieve a ${metric.target}% target within the ${metric.window} window. `;
    }

    markdown += '\n\n';
  }

  markdown += '## Monitoring & Alerting\n\n';
  markdown += '### Error Budget\n\n';
  markdown += 'Each SLO has an associated error budget based on the allowed downtime. ';
  markdown += 'When the error budget is exhausted:\n\n';
  markdown += '- Halt non-critical deployments\n';
  markdown += '- Focus on reliability improvements\n';
  markdown += '- Conduct incident review\n\n';

  markdown += '### Alerting Strategy\n\n';
  const criticalMetrics = metrics.filter((m) => m.severity === 'critical');
  if (criticalMetrics.length > 0) {
    markdown +=
      '**Critical SLOs:** Alert immediately when burn rate indicates budget will be exhausted in <2 hours\n\n';
  }
  markdown +=
    '**High SLOs:** Alert when burn rate indicates budget will be exhausted in <24 hours\n\n';
  markdown +=
    '**Medium SLOs:** Alert when burn rate indicates budget will be exhausted in <7 days\n\n';

  markdown += '## Review Process\n\n';
  markdown += '- **Frequency:** Quarterly\n';
  markdown += '- **Participants:** Engineering team, SRE, Product\n';
  markdown += '- **Review criteria:** User impact, operational cost, business requirements\n\n';

  markdown += '## Related Documents\n\n';
  markdown += '- Service Architecture\n';
  markdown += '- Incident Response Playbook\n';
  markdown += '- Monitoring Dashboard\n';
  markdown += '- On-call Runbook\n';

  return markdown;
}

/**
 * Creates a summary of the SLO draft
 */
function createSummary(serviceName: string, metrics: ProcessedMetric[]): string {
  const criticalCount = metrics.filter((m) => m.severity === 'critical').length;
  const highCount = metrics.filter((m) => m.severity === 'high').length;
  const mediumCount = metrics.filter((m) => m.severity === 'medium').length;

  let summary = `SLO draft for ${serviceName} with ${metrics.length} metric${metrics.length !== 1 ? 's' : ''}`;

  const parts: string[] = [];
  if (criticalCount > 0) parts.push(`${criticalCount} critical`);
  if (highCount > 0) parts.push(`${highCount} high`);
  if (mediumCount > 0) parts.push(`${mediumCount} medium`);

  if (parts.length > 0) {
    summary += ` (${parts.join(', ')} severity)`;
  }

  summary += '. ';

  // Add highest target info
  const highestTarget = Math.max(...metrics.map((m) => m.target));
  if (highestTarget >= 99.9) {
    summary += `Includes stringent ${highestTarget}% availability targets requiring careful monitoring and error budget management.`;
  } else if (highestTarget >= 99.0) {
    summary += `Targets balanced reliability with ${highestTarget}% as the highest objective.`;
  } else {
    summary += `Focuses on achievable targets with ${highestTarget}% as the highest objective.`;
  }

  return summary;
}

/**
 * SLO Draft Tool
 * Generates a comprehensive SLO document for a service
 */
export const sloDraftTool = tool({
  description:
    'Draft Service Level Objective (SLO) definitions for a service. Provide the service name and metrics (with name, target percentage, and time window) to generate a comprehensive SLO document in markdown format with error budgets, alerting strategies, and monitoring recommendations.',
  inputSchema: jsonSchema<SLODraftInput>({
    type: 'object',
    properties: {
      serviceName: {
        type: 'string',
        description: 'Name of the service (e.g., "API Gateway", "Payment Service")',
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
              description: 'Target percentage (e.g., 99.9 for 99.9%)',
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
    required: ['serviceName', 'metrics'],
    additionalProperties: false,
  }),
  async execute({ serviceName, metrics }): Promise<SLODraft> {
    // Validate inputs
    if (!serviceName || typeof serviceName !== 'string' || serviceName.trim().length === 0) {
      throw new Error('Service name is required and must be a non-empty string');
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

    // Generate the SLO document
    const sloMarkdown = generateSLOMarkdown(serviceName.trim(), processedMetrics);
    const summary = createSummary(serviceName.trim(), processedMetrics);

    const criticalMetrics = processedMetrics.filter((m) => m.severity === 'critical').length;

    return {
      slo: sloMarkdown,
      metrics: processedMetrics,
      summary,
      metadata: {
        serviceName: serviceName.trim(),
        createdAt: new Date().toISOString(),
        totalMetrics: processedMetrics.length,
        criticalMetrics,
      },
    };
  },
});

export default sloDraftTool;

/**
 * Error Log Triage Tool for TPMJS
 * Triages error logs by severity and frequency, groups similar errors,
 * and provides actionable recommendations for debugging.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Input log entry structure
 */
export interface LogEntry {
  message: string;
  level: string;
  timestamp: string;
}

/**
 * Grouped error with pattern and occurrences
 */
export interface ErrorGroup {
  pattern: string;
  count: number;
  severity: string;
  firstOccurrence: string;
  lastOccurrence: string;
  examples: string[];
}

/**
 * Output interface for error log triage
 */
export interface ErrorLogTriageResult {
  groups: ErrorGroup[];
  severityCounts: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  recommendations: string[];
  summary: {
    totalLogs: number;
    uniquePatterns: number;
    timeRange: string;
  };
}

type ErrorLogTriageInput = {
  logs: LogEntry[];
};

/**
 * Normalizes an error message to extract the pattern
 * Removes specific values like IDs, paths, timestamps to group similar errors
 * Domain rule: pattern_matching - Matches common error patterns by normalizing variable data
 */
function normalizeErrorMessage(message: string): string {
  return (
    message
      // Domain rule: pattern_matching - Remove file paths (Unix and Windows)
      .replace(/\/[\w\-/.]+/g, '[PATH]')
      .replace(/[A-Z]:\\[\w\-\\/.]+/g, '[PATH]')
      // Domain rule: pattern_matching - Remove UUIDs and IDs
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]')
      .replace(/\b(id|ID|Id)[:=]\s*\d+/g, 'id=[ID]')
      .replace(/\b\d{8,}\b/g, '[ID]')
      // Domain rule: pattern_matching - Remove timestamps
      .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?/g, '[TIMESTAMP]')
      // Domain rule: pattern_matching - Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      // Domain rule: pattern_matching - Remove IP addresses
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
      // Domain rule: pattern_matching - Remove line numbers
      .replace(/:\d+:\d+/g, ':[LINE]')
      .replace(/line \d+/gi, 'line [NUM]')
      // Domain rule: pattern_matching - Remove generic numbers
      .replace(/\b\d+\b/g, '[NUM]')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Maps log levels to severity (normalizes common variations)
 * Domain rule: categorization - Categorizes by severity (critical, error, warning, info)
 */
function mapSeverity(level: string): 'critical' | 'error' | 'warning' | 'info' {
  const normalized = level.toLowerCase();

  // Domain rule: categorization - Critical includes fatal, emergency
  if (
    normalized.includes('crit') ||
    normalized.includes('fatal') ||
    normalized.includes('emergency')
  ) {
    return 'critical';
  }
  // Domain rule: categorization - Error severity
  if (normalized.includes('err')) {
    return 'error';
  }
  // Domain rule: categorization - Warning severity
  if (normalized.includes('warn')) {
    return 'warning';
  }
  // Domain rule: categorization - Info severity (default)
  return 'info';
}

/**
 * Groups logs by error pattern
 */
function groupLogsByPattern(logs: LogEntry[]): Map<string, LogEntry[]> {
  const groups = new Map<string, LogEntry[]>();

  for (const log of logs) {
    const pattern = normalizeErrorMessage(log.message);
    const existing = groups.get(pattern) || [];
    existing.push(log);
    groups.set(pattern, existing);
  }

  return groups;
}

/**
 * Generates recommendations based on error patterns
 * Domain rule: recommendations - Provides actionable next steps based on patterns
 */
function generateRecommendations(groups: ErrorGroup[]): string[] {
  const recommendations: string[] = [];

  // Sort by severity and count
  const sortedGroups = [...groups].sort((a, b) => {
    const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
    const severityDiff =
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  // Domain rule: recommendations - Prioritize critical errors
  const criticalGroups = sortedGroups.filter((g) => g.severity === 'critical');
  if (criticalGroups.length > 0) {
    recommendations.push(
      `Address ${criticalGroups.length} critical error pattern(s) immediately - these may cause system outages`
    );
  }

  // High-frequency errors
  const highFrequency = sortedGroups.filter((g) => g.count >= 10 && g.severity !== 'info');
  if (highFrequency.length > 0) {
    recommendations.push(
      `Investigate ${highFrequency.length} high-frequency error pattern(s) (10+ occurrences) - these indicate systemic issues`
    );
  }

  // Recent errors
  const now = Date.now();
  const recentErrors = sortedGroups.filter((g) => {
    try {
      const lastOccurrence = new Date(g.lastOccurrence).getTime();
      return now - lastOccurrence < 3600000; // Within last hour
    } catch {
      return false;
    }
  });
  if (recentErrors.length > 0) {
    recommendations.push(
      `Monitor ${recentErrors.length} error pattern(s) that occurred in the last hour`
    );
  }

  // Pattern diversity
  const errorGroups = sortedGroups.filter(
    (g) => g.severity === 'error' || g.severity === 'critical'
  );
  if (errorGroups.length > 5) {
    recommendations.push(
      `High error diversity detected (${errorGroups.length} unique patterns) - consider improving error handling and logging`
    );
  }

  // Domain rule: recommendations - Specific actionable next steps by error category
  // Domain rule: categorization - Categories include timeout, auth, network, schema, etc.
  for (const group of sortedGroups.slice(0, 3)) {
    const pattern = group.pattern.toLowerCase();

    if (pattern.includes('timeout') || pattern.includes('timed out')) {
      recommendations.push(
        `Review timeout configurations - ${group.count} timeout error(s) detected`
      );
    } else if (
      pattern.includes('null') ||
      pattern.includes('undefined') ||
      pattern.includes('cannot read property')
    ) {
      recommendations.push(
        `Add null checks - ${group.count} null/undefined reference error(s) detected`
      );
    } else if (pattern.includes('connection') || pattern.includes('econnrefused')) {
      recommendations.push(
        `Check network and database connectivity - ${group.count} connection error(s) detected`
      );
    } else if (
      pattern.includes('permission') ||
      pattern.includes('unauthorized') ||
      pattern.includes('forbidden')
    ) {
      recommendations.push(`Review access controls - ${group.count} permission error(s) detected`);
    } else if (pattern.includes('not found') || pattern.includes('enoent')) {
      recommendations.push(
        `Verify file/resource existence - ${group.count} 'not found' error(s) detected`
      );
    }
  }

  // Default recommendation if none generated
  if (recommendations.length === 0) {
    recommendations.push('All errors appear to be low severity - continue monitoring for patterns');
  }

  return recommendations.slice(0, 10); // Limit to 10 recommendations
}

/**
 * Error Log Triage Tool
 * Analyzes error logs to identify patterns, severity, and provide recommendations
 */
export const errorLogTriageTool = tool({
  description:
    'Triages error logs by severity and frequency. Groups similar errors together by pattern (removing IDs, paths, timestamps), counts occurrences, tracks time ranges, and provides actionable recommendations for debugging. Useful for analyzing application logs, identifying systemic issues, and prioritizing bug fixes.',
  inputSchema: jsonSchema<ErrorLogTriageInput>({
    type: 'object',
    properties: {
      logs: {
        type: 'array',
        description: 'Array of log entries to analyze',
        items: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The log message/error text',
            },
            level: {
              type: 'string',
              description: 'Log level (e.g., error, warning, info, critical)',
            },
            timestamp: {
              type: 'string',
              description: 'ISO 8601 timestamp of when the log occurred',
            },
          },
          required: ['message', 'level', 'timestamp'],
        },
      },
    },
    required: ['logs'],
    additionalProperties: false,
  }),
  async execute({ logs }): Promise<ErrorLogTriageResult> {
    // Validate input
    if (!Array.isArray(logs)) {
      throw new Error('logs must be an array');
    }

    if (logs.length === 0) {
      return {
        groups: [],
        severityCounts: { critical: 0, error: 0, warning: 0, info: 0 },
        recommendations: ['No logs to analyze'],
        summary: {
          totalLogs: 0,
          uniquePatterns: 0,
          timeRange: 'N/A',
        },
      };
    }

    // Group logs by pattern
    const patternGroups = groupLogsByPattern(logs);

    // Build error groups
    const groups: ErrorGroup[] = [];
    const severityCounts = { critical: 0, error: 0, warning: 0, info: 0 };

    for (const [pattern, groupLogs] of patternGroups.entries()) {
      // Determine severity (use highest severity in group)
      const severities = groupLogs.map((log) => mapSeverity(log.level));
      const severity = severities.includes('critical')
        ? 'critical'
        : severities.includes('error')
          ? 'error'
          : severities.includes('warning')
            ? 'warning'
            : 'info';

      // Count by severity
      severityCounts[severity] += groupLogs.length;

      // Get time range
      const timestamps = groupLogs
        .map((log) => {
          try {
            return new Date(log.timestamp).getTime();
          } catch {
            return 0;
          }
        })
        .filter((t) => t > 0)
        .sort((a, b) => a - b);

      const firstTimestamp = timestamps[0];
      const lastTimestamp = timestamps[timestamps.length - 1];
      const firstLog = groupLogs[0];
      const lastLog = groupLogs[groupLogs.length - 1];

      const firstOccurrence =
        timestamps.length > 0 && firstTimestamp !== undefined
          ? new Date(firstTimestamp).toISOString()
          : (firstLog?.timestamp ?? new Date().toISOString());
      const lastOccurrence =
        timestamps.length > 0 && lastTimestamp !== undefined
          ? new Date(lastTimestamp).toISOString()
          : (lastLog?.timestamp ?? new Date().toISOString());

      // Get example messages (up to 3)
      const examples = groupLogs.slice(0, 3).map((log) => log.message);

      groups.push({
        pattern,
        count: groupLogs.length,
        severity,
        firstOccurrence,
        lastOccurrence,
        examples,
      });
    }

    // Sort groups by severity then count
    groups.sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      const severityDiff =
        severityOrder[a.severity as keyof typeof severityOrder] -
        severityOrder[b.severity as keyof typeof severityOrder];
      if (severityDiff !== 0) return severityDiff;
      return b.count - a.count;
    });

    // Calculate time range
    const allTimestamps = logs
      .map((log) => {
        try {
          return new Date(log.timestamp).getTime();
        } catch {
          return 0;
        }
      })
      .filter((t) => t > 0)
      .sort((a, b) => a - b);

    const firstAllTimestamp = allTimestamps[0];
    const lastAllTimestamp = allTimestamps[allTimestamps.length - 1];

    const timeRange =
      allTimestamps.length > 0 && firstAllTimestamp !== undefined && lastAllTimestamp !== undefined
        ? `${new Date(firstAllTimestamp).toISOString()} to ${new Date(lastAllTimestamp).toISOString()}`
        : 'Unable to determine';

    // Generate recommendations
    const recommendations = generateRecommendations(groups);

    return {
      groups,
      severityCounts,
      recommendations,
      summary: {
        totalLogs: logs.length,
        uniquePatterns: groups.length,
        timeRange,
      },
    };
  },
});

export default errorLogTriageTool;

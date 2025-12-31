# @tpmjs/tools-monitoring-gap-analysis

Analyze monitoring coverage gaps across services and endpoints to identify missing metrics, alerts, or logs with prioritized recommendations.

## Installation

```bash
npm install @tpmjs/tools-monitoring-gap-analysis
```

## Usage

```typescript
import { monitoringGapAnalysisTool } from '@tpmjs/tools-monitoring-gap-analysis';

// Analyze monitoring coverage
const result = await monitoringGapAnalysisTool.execute({
  services: [
    {
      name: 'API Gateway',
      hasMetrics: true,
      hasAlerts: true,
      hasLogs: true
    },
    {
      name: 'Payment Service',
      hasMetrics: true,
      hasAlerts: false,
      hasLogs: true
    },
    {
      name: 'Email Worker',
      hasMetrics: false,
      hasAlerts: false,
      hasLogs: false
    },
    {
      name: 'User Service',
      hasMetrics: true,
      hasAlerts: true,
      hasLogs: false
    }
  ]
});

console.log(result.coverageScore); // 58
console.log(result.summary);
// "Analyzed 4 services with 58% overall monitoring coverage. Found 5 gaps across 3 services, including 1 critical gap requiring immediate attention."

console.log(result.gaps);
// [
//   {
//     service: "Email Worker",
//     gapType: "critical",
//     severity: "critical",
//     description: "Service has no monitoring coverage",
//     impact: "Cannot detect outages..."
//   },
//   ...
// ]

console.log(result.recommendations);
// [
//   {
//     priority: "high",
//     category: "metrics",
//     title: "Implement metrics collection for unmonitored services",
//     description: "Deploy metric exporters...",
//     affectedServices: ["Email Worker"]
//   },
//   ...
// ]
```

## Input

- `services` (array, required): Array of service objects with:
  - `name` (string): Service name
  - `hasMetrics` (boolean): Whether metrics collection is configured
  - `hasAlerts` (boolean): Whether alerting is configured
  - `hasLogs` (boolean): Whether log collection is configured

## Output

Returns an object with:

- `gaps` (array): Identified monitoring gaps, each containing:
  - `service` (string): Service name
  - `gapType` ('metrics' | 'alerts' | 'logs' | 'critical'): Type of gap
  - `severity` ('critical' | 'high' | 'medium'): Gap severity
  - `description` (string): What is missing
  - `impact` (string): Business/operational impact
- `recommendations` (array): Prioritized recommendations, each containing:
  - `priority` ('high' | 'medium' | 'low'): Action priority
  - `category` ('metrics' | 'alerts' | 'logs' | 'infrastructure'): Recommendation type
  - `title` (string): Short recommendation title
  - `description` (string): Detailed implementation guidance
  - `affectedServices` (array): List of services this applies to
- `coverageScore` (number): Overall coverage score 0-100 (based on % of services with complete monitoring)
- `summary` (string): Human-readable analysis summary
- `metadata` (object):
  - `totalServices`: Number of services analyzed
  - `servicesWithGaps`: Number of services with at least one gap
  - `criticalGaps`: Number of critical severity gaps
  - `analyzedAt`: ISO timestamp
  - `coverageBreakdown`: Coverage percentages by type (metrics, alerts, logs)

## Features

- **Severity Classification**: Gaps are classified as critical, high, or medium based on impact
- **Smart Recommendations**: Prioritized, actionable recommendations grouped by category
- **Coverage Scoring**: 0-100 score based on complete monitoring coverage (metrics + alerts + logs)
- **Coverage Breakdown**: See coverage percentages by monitoring type
- **Critical Gap Detection**: Services with zero monitoring are flagged as critical
- **Infrastructure Recommendations**: Suggests platform-level improvements when many services lack monitoring

## Gap Severity Logic

- **Critical**: Service has NO monitoring coverage at all (no metrics, alerts, or logs)
- **High**: Missing critical monitoring component (metrics or alerts)
- **Medium**: Missing logs (when metrics/alerts exist)

## Coverage Score Calculation

Score = (Total monitoring components present) / (Total services × 3) × 100

Each service can have up to 3 components (metrics, alerts, logs). A service with all three counts as 100% covered.

## Example Scenarios

### Well-monitored Infrastructure
```typescript
// All services fully monitored
const result = await monitoringGapAnalysisTool.execute({
  services: [
    { name: 'API', hasMetrics: true, hasAlerts: true, hasLogs: true },
    { name: 'DB', hasMetrics: true, hasAlerts: true, hasLogs: true }
  ]
});
// coverageScore: 100
// gaps: []
```

### Partial Monitoring (Common)
```typescript
// Some gaps across services
const result = await monitoringGapAnalysisTool.execute({
  services: [
    { name: 'API', hasMetrics: true, hasAlerts: true, hasLogs: false },
    { name: 'Worker', hasMetrics: true, hasAlerts: false, hasLogs: false }
  ]
});
// coverageScore: 50
// gaps: 3 (1 medium for API logs, 2 high for Worker alerts/logs)
```

### Critical Gaps
```typescript
// Unmonitored service
const result = await monitoringGapAnalysisTool.execute({
  services: [
    { name: 'Legacy Service', hasMetrics: false, hasAlerts: false, hasLogs: false }
  ]
});
// coverageScore: 0
// gaps: 1 critical
// recommendations: High priority infrastructure setup
```

## License

MIT

# @tpmjs/tools-slo-draft

Draft Service Level Objective (SLO) definitions for services with comprehensive documentation, error budgets, and alerting strategies.

## Installation

```bash
npm install @tpmjs/tools-slo-draft
```

## Usage

```typescript
import { sloDraftTool } from '@tpmjs/tools-slo-draft';

// Use with Vercel AI SDK
const result = await sloDraftTool.execute({
  serviceName: 'Payment API',
  metrics: [
    {
      name: 'Availability',
      target: 99.9,
      window: '30d'
    },
    {
      name: 'API Latency P99',
      target: 95.0,
      window: 'rolling 7 days'
    },
    {
      name: 'Error Rate',
      target: 99.5,
      window: '30d'
    }
  ]
});

console.log(result.slo); // Markdown formatted SLO document
console.log(result.summary); // Brief summary
console.log(result.metrics); // Processed metrics with severity
```

## Input

- `serviceName` (string, required): Name of the service
- `metrics` (array, required): Array of metric objects with:
  - `name` (string): Metric name (e.g., "Availability", "Latency P99")
  - `target` (number): Target percentage (0-100)
  - `window` (string): Time window (e.g., "30d", "7 days", "rolling 30 days")

## Output

Returns an object with:

- `slo` (string): Comprehensive SLO document in markdown format
- `metrics` (array): Processed metrics with additional metadata:
  - Original name, target, window
  - `windowType`: 'rolling' or 'calendar'
  - `severity`: 'critical' (≥99.9%), 'high' (≥99%), or 'medium' (<99%)
- `summary` (string): Brief summary of the SLO
- `metadata` (object):
  - `serviceName`: Service name
  - `createdAt`: ISO timestamp
  - `totalMetrics`: Total number of metrics
  - `criticalMetrics`: Number of critical severity metrics

## Features

- **Automatic Severity Classification**: Metrics are classified as critical, high, or medium based on targets
- **Error Budget Calculation**: Calculates allowed downtime for each metric
- **Alerting Strategy**: Provides burn rate-based alerting recommendations
- **Window Type Detection**: Automatically detects rolling vs calendar windows
- **Comprehensive Documentation**: Generates full SLO document with monitoring and review processes

## Example Output

The tool generates a markdown document including:

- SLO definitions with targets and allowed downtime
- Error budget policies
- Alerting strategies based on severity
- Review processes and schedules
- Links to related documentation

## License

MIT

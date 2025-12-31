# Workflow Variant Generate

Generate multiple variations of a workflow with configurable constraints for testing, optimization, and exploration.

## Installation

```bash
npm install @tpmjs/tools-workflow-variant-generate
```

## Usage

```typescript
import { workflowVariantGenerateTool } from '@tpmjs/tools-workflow-variant-generate';

const result = await workflowVariantGenerateTool.execute({
  workflow: {
    name: 'CI/CD Pipeline',
    description: 'Continuous integration and deployment',
    steps: [
      { action: 'checkout', details: 'Clone repository', duration: 1 },
      { action: 'test', details: 'Run test suite', duration: 5 },
      { action: 'build', details: 'Build production bundle', duration: 3 },
      { action: 'deploy', details: 'Deploy to production', duration: 2 }
    ]
  },
  variationCount: 3,
  constraints: {
    allowStepRemoval: true,
    allowStepModification: true,
    allowReordering: false,
    requiredSteps: ['checkout', 'deploy']
  }
});

console.log(result.variants);
// [
//   {
//     name: 'CI/CD Pipeline (Variant 1)',
//     steps: [...], // Modified version
//     metadata: {
//       variantNumber: 1,
//       hash: 'abc123...',
//       modifications: ['Modified test duration: 5m → 7m']
//     }
//   },
//   ...
// ]
```

## Constraints

Control how variants are generated:

### Step Count Constraints

- `maxSteps` (number) - Maximum steps per variant (default: 20)
- `minSteps` (number) - Minimum steps per variant (default: 1)

### Modification Constraints

- `allowStepRemoval` (boolean) - Allow removing steps (default: true)
- `allowStepModification` (boolean) - Allow modifying step properties (default: true)
- `allowReordering` (boolean) - Allow reordering steps (default: true)
- `preserveOrder` (boolean) - Force original order (default: false)

### Step Constraints

- `requiredSteps` (string[]) - Step actions that must be included
- `forbiddenSteps` (string[]) - Step actions that must not be included

## Features

- **Deterministic Generation**: Same input produces same variants
- **Constraint Validation**: Ensures variants meet all constraints
- **Hash Tracking**: Each variant has a unique hash for identification
- **Modification Logs**: Track what changed in each variant
- **Dependency Awareness**: Respects step dependencies when reordering

## Examples

### Generate Simple Variants

```typescript
const result = await workflowVariantGenerateTool.execute({
  workflow: {
    name: 'Deployment',
    steps: [
      { action: 'build' },
      { action: 'test' },
      { action: 'deploy' }
    ]
  },
  variationCount: 5
});
```

### Preserve Order, Allow Modifications

```typescript
const result = await workflowVariantGenerateTool.execute({
  workflow: {
    name: 'Data Pipeline',
    steps: [
      { action: 'extract', duration: 10 },
      { action: 'transform', duration: 20 },
      { action: 'load', duration: 5 }
    ]
  },
  variationCount: 3,
  constraints: {
    preserveOrder: true,
    allowStepModification: true,
    allowStepRemoval: false
  }
});
// Variants will have same order but different durations/details
```

### Required and Forbidden Steps

```typescript
const result = await workflowVariantGenerateTool.execute({
  workflow: {
    name: 'Security Scan',
    steps: [
      { action: 'scan-dependencies' },
      { action: 'scan-code' },
      { action: 'scan-secrets' },
      { action: 'generate-report' },
      { action: 'upload-results' }
    ]
  },
  variationCount: 4,
  constraints: {
    requiredSteps: ['generate-report'], // Must include
    forbiddenSteps: ['upload-results'], // Must exclude
    allowStepRemoval: true
  }
});
```

### Optimize for Speed (Fewer Steps)

```typescript
const result = await workflowVariantGenerateTool.execute({
  workflow: {
    name: 'Full Test Suite',
    steps: [
      { action: 'unit-tests', duration: 5 },
      { action: 'integration-tests', duration: 10 },
      { action: 'e2e-tests', duration: 20 },
      { action: 'performance-tests', duration: 15 },
      { action: 'security-tests', duration: 8 }
    ]
  },
  variationCount: 3,
  constraints: {
    maxSteps: 3, // Optimize by reducing steps
    requiredSteps: ['unit-tests']
  }
});
```

### Generate Test Scenarios

```typescript
const result = await workflowVariantGenerateTool.execute({
  workflow: {
    name: 'User Onboarding',
    steps: [
      { action: 'create-account' },
      { action: 'verify-email' },
      { action: 'complete-profile' },
      { action: 'setup-preferences' },
      { action: 'tutorial' }
    ]
  },
  variationCount: 5,
  constraints: {
    requiredSteps: ['create-account', 'verify-email'],
    allowStepRemoval: true,
    allowReordering: true
  }
});
// Creates different user flow variants for testing
```

## Output Structure

```typescript
{
  variants: [
    {
      name: 'Workflow Name (Variant 1)',
      description: 'Workflow description - Variant 1',
      steps: [
        { action: 'step1', details: '...', duration: 5 }
      ],
      metadata: {
        variantNumber: 1,
        derivedFrom: 'Workflow Name',
        generatedAt: '2025-01-01T00:00:00.000Z',
        hash: 'abc123...', // Variant hash
        modifications: [
          'Modified step1 duration: 5m → 7m',
          'Removed step: step2'
        ]
      }
    }
  ],
  originalHash: 'xyz789...', // Original workflow hash
  variantHashes: ['abc123...', 'def456...'] // All variant hashes
}
```

## Use Cases

- **A/B Testing**: Generate workflow variants for comparison
- **Optimization**: Explore different execution strategies
- **Test Coverage**: Create diverse test scenarios
- **What-If Analysis**: Explore alternative approaches
- **Load Testing**: Generate varied workload patterns
- **Documentation**: Show multiple implementation options

## Modification Types

The tool can apply these modifications:

1. **Step Removal**: Remove non-required steps
2. **Duration Adjustment**: Modify step durations
3. **Details Enhancement**: Add optimization notes to details
4. **Step Reordering**: Swap adjacent independent steps
5. **Constraint Filtering**: Remove forbidden steps

Each variant tracks its modifications in the metadata.

## Hash Usage

Hashes can be used for:
- **Deduplication**: Identify identical variants
- **Caching**: Cache results by variant hash
- **Comparison**: Track changes between variants
- **Versioning**: Version workflows by hash

## License

MIT

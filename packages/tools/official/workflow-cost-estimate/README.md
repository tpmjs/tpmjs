# @tpmjs/tools-workflow-cost-estimate

Estimates cost of running a workflow based on step count, step types, and estimated API calls.

## Features

- **Type-Based Cost Multipliers**: Different step types (LLM, API, database) have different costs
- **Custom Cost Support**: Override automatic calculation with custom costs per step
- **Detailed Breakdown**: Get per-step cost breakdown with full transparency
- **Flexible Configuration**: Set base cost rate and per-step estimates
- **Multiple LLM Tiers**: Support for small, standard, and large language models

## Installation

```bash
npm install @tpmjs/tools-workflow-cost-estimate
```

## Usage

### Basic Example

```typescript
import { workflowCostEstimateTool } from '@tpmjs/tools-workflow-cost-estimate';

const workflow = {
  steps: [
    { id: 'fetch-data', type: 'api' },
    { id: 'process-llm', type: 'llm' },
    { id: 'save-db', type: 'database' }
  ]
};

const result = await workflowCostEstimateTool.execute({
  workflow,
  costPerStep: 0.01 // $0.01 base rate
});

console.log(result);
// {
//   totalCost: 0.045,
//   stepCount: 3,
//   breakdown: [
//     { stepId: 'fetch-data', stepCost: 0.01, ... },
//     { stepId: 'process-llm', stepCost: 0.03, ... },
//     { stepId: 'save-db', stepCost: 0.005, ... }
//   ],
//   currency: 'USD',
//   metadata: { ... }
// }
```

### With Estimated API Calls

```typescript
const workflow = {
  steps: [
    {
      id: 'bulk-fetch',
      type: 'api',
      estimatedCalls: 10 // This step makes 10 API calls
    },
    {
      id: 'process-each',
      type: 'llm',
      estimatedCalls: 10 // Process each item with LLM
    }
  ]
};

const result = await workflowCostEstimateTool.execute({
  workflow,
  costPerStep: 0.01
});

console.log(result.totalCost); // 0.4 (10 * 0.01 + 10 * 0.03)
```

### With Custom Costs

```typescript
const workflow = {
  steps: [
    {
      id: 'expensive-api',
      customCost: 0.05, // Override with exact cost
      estimatedCalls: 5
    },
    {
      id: 'cheap-transform',
      type: 'transform' // Uses type multiplier
    }
  ]
};

const result = await workflowCostEstimateTool.execute({ workflow });

console.log(result.totalCost); // 0.255 (0.05 * 5 + 0.01 * 0.5)
```

## Step Type Multipliers

The tool applies these multipliers to the base cost:

| Step Type | Multiplier | Example Cost (base $0.01) |
|-----------|------------|---------------------------|
| `llm-large` | 5.0x | $0.05 |
| `llm` | 3.0x | $0.03 |
| `compute` | 2.0x | $0.02 |
| `api` | 1.0x | $0.01 |
| `llm-small` | 1.0x | $0.01 |
| `http` | 1.0x | $0.01 |
| `transform` | 0.5x | $0.005 |
| `database` | 0.5x | $0.005 |
| `validation` | 0.3x | $0.003 |
| `storage` | 0.3x | $0.003 |
| `default` | 1.0x | $0.01 |

## Cost Estimate Result

```typescript
interface CostEstimate {
  totalCost: number;           // Total estimated cost in USD
  stepCount: number;           // Number of steps in workflow
  breakdown: StepCostBreakdown[]; // Per-step cost details
  currency: string;            // Currency code (always 'USD')
  metadata: {
    averageCostPerStep: number;    // Mean cost per step
    totalEstimatedCalls: number;   // Sum of all API calls
    baseRate: number;              // Base cost rate used
  };
}

interface StepCostBreakdown {
  stepId: string;
  stepIndex: number;
  stepName?: string;
  stepType?: string;
  estimatedCalls: number;
  costPerCall: number;
  stepCost: number;
}
```

## Use Cases

### 1. Budget Planning

```typescript
const workflow = await buildWorkflow();
const estimate = await workflowCostEstimateTool.execute({
  workflow,
  costPerStep: 0.02 // Conservative estimate
});

if (estimate.totalCost > BUDGET_LIMIT) {
  console.warn(`Workflow exceeds budget: $${estimate.totalCost}`);
  // Optimize or reject workflow
}
```

### 2. Cost Comparison

```typescript
const workflowA = { steps: [/* ... */] };
const workflowB = { steps: [/* ... */] };

const costA = await workflowCostEstimateTool.execute({ workflow: workflowA });
const costB = await workflowCostEstimateTool.execute({ workflow: workflowB });

console.log(`Workflow A: $${costA.totalCost}`);
console.log(`Workflow B: $${costB.totalCost}`);
console.log(`Savings: $${Math.abs(costA.totalCost - costB.totalCost)}`);
```

### 3. Cost Breakdown Reporting

```typescript
const estimate = await workflowCostEstimateTool.execute({ workflow });

console.log(`Total: $${estimate.totalCost}\n`);
console.log('Breakdown by step:');

for (const step of estimate.breakdown) {
  console.log(
    `  ${step.stepName || step.stepId}: $${step.stepCost} ` +
    `(${step.estimatedCalls} calls × $${step.costPerCall})`
  );
}
```

### 4. Optimization Recommendations

```typescript
const estimate = await workflowCostEstimateTool.execute({ workflow });

// Find most expensive steps
const expensiveSteps = estimate.breakdown
  .filter(step => step.stepCost > 0.05)
  .sort((a, b) => b.stepCost - a.stepCost);

console.log('Steps to optimize:');
expensiveSteps.forEach(step => {
  console.log(`  - ${step.stepId}: $${step.stepCost}`);
});
```

### 5. Dynamic Pricing

```typescript
// Adjust base rate based on user tier
const userTierRates = {
  free: 0.015,
  pro: 0.01,
  enterprise: 0.005
};

const estimate = await workflowCostEstimateTool.execute({
  workflow,
  costPerStep: userTierRates[userTier]
});

console.log(`Cost for ${userTier} tier: $${estimate.totalCost}`);
```

## Advanced Example

```typescript
const complexWorkflow = {
  steps: [
    {
      id: 'fetch-documents',
      name: 'Fetch user documents',
      type: 'api',
      estimatedCalls: 20
    },
    {
      id: 'extract-text',
      name: 'Extract text from PDFs',
      type: 'compute',
      estimatedCalls: 20
    },
    {
      id: 'summarize-llm',
      name: 'Generate summaries',
      type: 'llm-large',
      estimatedCalls: 20
    },
    {
      id: 'sentiment-analysis',
      name: 'Analyze sentiment',
      type: 'llm-small',
      estimatedCalls: 20
    },
    {
      id: 'store-results',
      name: 'Save to database',
      type: 'database',
      estimatedCalls: 20
    },
    {
      id: 'send-notification',
      name: 'Send email notification',
      customCost: 0.001, // Exact cost from email provider
      estimatedCalls: 1
    }
  ],
  metadata: {
    name: 'Document Processing Pipeline',
    version: '2.0.0'
  }
};

const estimate = await workflowCostEstimateTool.execute({
  workflow: complexWorkflow,
  costPerStep: 0.01
});

console.log(`Total cost: $${estimate.totalCost}`);
console.log(`Average per step: $${estimate.metadata.averageCostPerStep}`);
console.log(`Total API calls: ${estimate.metadata.totalEstimatedCalls}`);
```

## Error Handling

```typescript
try {
  await workflowCostEstimateTool.execute({
    workflow: { steps: [] }
  });
} catch (error) {
  // Valid - empty workflow is allowed
}

try {
  await workflowCostEstimateTool.execute({
    workflow: null
  });
} catch (error) {
  console.error(error.message); // "Workflow must be an object"
}

try {
  await workflowCostEstimateTool.execute({
    workflow: { steps: [{ id: 'step1', estimatedCalls: -5 }] }
  });
} catch (error) {
  console.error(error.message); // "Step 'step1' has invalid estimatedCalls..."
}
```

## Default Values

- **Base cost per step**: $0.01 USD
- **Estimated calls per step**: 1
- **Currency**: USD

## License

MIT

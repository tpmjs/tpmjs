# @tpmjs/tools-workflow-validate-io

Validates that workflow step inputs/outputs are compatible and checks type chains between steps.

## Features

- **Type Compatibility Checking**: Validates that connected steps have compatible input/output types
- **Source Validation**: Ensures input sources reference existing step outputs
- **Comprehensive Error Reporting**: Provides detailed error and warning messages with step context
- **Flexible Type System**: Supports basic types, arrays, objects, and 'any' type
- **Unused Output Detection**: Warns about outputs that are never consumed by subsequent steps

## Installation

```bash
npm install @tpmjs/tools-workflow-validate-io
```

## Usage

```typescript
import { workflowValidateIOTool } from '@tpmjs/tools-workflow-validate-io';

const workflow = {
  steps: [
    {
      id: 'fetch-data',
      outputs: {
        data: { type: 'object' },
        count: { type: 'number' }
      }
    },
    {
      id: 'process-data',
      inputs: {
        rawData: { type: 'object', source: 'fetch-data.data' },
        threshold: { type: 'number', source: 'fetch-data.count' }
      },
      outputs: {
        result: { type: 'string' }
      }
    },
    {
      id: 'send-result',
      inputs: {
        message: { type: 'string', source: 'process-data.result' }
      }
    }
  ]
};

const result = await workflowValidateIOTool.execute({ workflow });

console.log(result);
// {
//   valid: true,
//   issues: [],
//   stepCount: 3
// }
```

## Workflow Structure

Each workflow step should have:

- `id` (required): Unique identifier for the step
- `name` (optional): Human-readable name
- `inputs` (optional): Object where keys are input names and values contain:
  - `type` (required): Expected type (string, number, object, array, any, etc.)
  - `source` (optional): Reference to output in format "stepId.outputName"
- `outputs` (optional): Object where keys are output names and values contain:
  - `type` (required): Output type

## Type Compatibility

The validator supports:

- **Exact matches**: `string` → `string`
- **Any type**: `any` is compatible with all types
- **Array compatibility**: `string[]` ↔ `array`
- **Object compatibility**: `object` ↔ `{ ... }`
- **Number/Integer**: `number` ↔ `integer`

## Validation Issues

The tool reports two severity levels:

### Errors (prevent valid: true)

- Missing step IDs
- Missing type definitions
- Unknown source references
- Type mismatches between connected steps

### Warnings (don't prevent valid: true)

- Steps with no inputs or outputs
- Outputs never used by subsequent steps (except final step)

## Example with Errors

```typescript
const invalidWorkflow = {
  steps: [
    {
      id: 'step1',
      outputs: {
        result: { type: 'string' }
      }
    },
    {
      id: 'step2',
      inputs: {
        data: { type: 'number', source: 'step1.result' } // Type mismatch!
      }
    }
  ]
};

const result = await workflowValidateIOTool.execute({ workflow: invalidWorkflow });

console.log(result);
// {
//   valid: false,
//   issues: [
//     {
//       stepId: 'step2',
//       stepIndex: 1,
//       severity: 'error',
//       message: "Type mismatch: Input 'data' expects type 'number' but source 'step1.result' from step 'step1' (index 0) outputs type 'string'",
//       field: 'data'
//     }
//   ],
//   stepCount: 2
// }
```

## Use Cases

- **Agent Systems**: Validate tool chains before execution
- **Workflow Builders**: Real-time validation in visual workflow editors
- **CI/CD**: Validate workflow definitions in automated pipelines
- **Documentation**: Generate workflow diagrams with validated connections

## License

MIT

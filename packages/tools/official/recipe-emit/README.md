# @tpmjs/tools-recipe-emit

Emits a recipe in standard format for workflow orchestration. Validates and formats workflow recipes with steps, inputs, and outputs.

## Installation

```bash
npm install @tpmjs/tools-recipe-emit
```

## Usage

```typescript
import { recipeEmitTool } from '@tpmjs/tools-recipe-emit';

const result = await recipeEmitTool.execute({
  name: 'Data Processing Pipeline',
  steps: [
    {
      tool: 'fetchData',
      inputs: { url: 'https://api.example.com/data' },
      outputs: { rawData: 'string' },
      description: 'Fetch data from API',
    },
    {
      tool: 'transformData',
      inputs: { rawData: 'string' },
      outputs: { processedData: 'object' },
      description: 'Transform raw data',
    },
    {
      tool: 'saveData',
      inputs: { processedData: 'object' },
      outputs: { success: 'boolean' },
      description: 'Save processed data',
    },
  ],
  metadata: {
    author: 'John Doe',
    version: '1.0.0',
    description: 'A simple data processing pipeline',
    tags: ['data', 'pipeline', 'etl'],
  },
});

console.log(result);
// {
//   recipe: {
//     name: 'Data Processing Pipeline',
//     version: '1.0.0',
//     steps: [...],
//     metadata: {...}
//   },
//   format: 'tpmjs-recipe-v1',
//   stepCount: 3,
//   validation: {
//     isValid: true,
//     warnings: []
//   }
// }
```

## Features

- **Validation**: Validates recipe structure and warns about potential issues
- **Step Chaining**: Detects missing connections between step outputs and inputs
- **Standard Format**: Outputs recipes in the TPMJS standard format (tpmjs-recipe-v1)
- **Metadata Support**: Includes author, version, tags, and custom metadata
- **Detailed Warnings**: Provides actionable warnings for recipe improvement

## Input Schema

```typescript
{
  name: string;              // Recipe name
  steps: Array<{             // Workflow steps
    tool: string;            // Tool name to execute
    inputs: object;          // Input parameters
    outputs: object;         // Expected outputs
    description?: string;    // Optional step description
  }>;
  metadata?: {               // Optional metadata
    author?: string;
    version?: string;
    description?: string;
    tags?: string[];
    createdAt?: string;
  };
}
```

## Output Schema

```typescript
{
  recipe: {
    name: string;
    version: string;
    steps: RecipeStep[];
    metadata: RecipeMetadata;
  };
  format: string;            // Always 'tpmjs-recipe-v1'
  stepCount: number;         // Number of steps
  validation: {
    isValid: boolean;        // Whether recipe is valid
    warnings: string[];      // Validation warnings
  };
}
```

## License

MIT

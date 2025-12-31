# @tpmjs/tools-prompt-to-workflow-skeleton

Creates workflow skeleton from natural language prompt. Analyzes user intent and maps to available tools to generate a workflow structure.

## Installation

```bash
npm install @tpmjs/tools-prompt-to-workflow-skeleton
```

## Usage

```typescript
import { promptToWorkflowSkeletonTool } from '@tpmjs/tools-prompt-to-workflow-skeleton';

const result = await promptToWorkflowSkeletonTool.execute({
  prompt: 'Fetch user data from the API, validate it, and save it to the database',
  availableTools: [
    'fetchTool',
    'validateTool',
    'saveTool',
    'logTool',
    'errorHandlerTool',
  ],
});

console.log(result);
// {
//   skeleton: {
//     name: 'Fetch User Data',
//     description: 'Fetch user data from the API, validate it, and save it to the database',
//     steps: [
//       {
//         stepNumber: 1,
//         toolName: 'fetch',
//         purpose: 'Fetch the data',
//         estimatedInputs: ['inputData'],
//         estimatedOutputs: ['output1'],
//         isAvailable: true
//       },
//       {
//         stepNumber: 2,
//         toolName: 'validate',
//         purpose: 'Validate the data',
//         estimatedInputs: ['output1'],
//         estimatedOutputs: ['output2'],
//         isAvailable: true
//       },
//       {
//         stepNumber: 3,
//         toolName: 'save',
//         purpose: 'Save the data',
//         estimatedInputs: ['output2'],
//         estimatedOutputs: ['output3'],
//         isAvailable: true
//       }
//     ]
//   },
//   suggestedTools: [
//     {
//       name: 'fetch',
//       reason: 'Required to fetch data in the workflow',
//       priority: 'high',
//       isAvailable: true
//     },
//     ...
//   ],
//   confidence: 0.9,
//   analysis: {
//     detectedIntent: 'fetch transform save',
//     complexity: 'moderate',
//     estimatedSteps: 3,
//     keyActions: ['fetch', 'validate', 'save']
//   }
// }
```

## Features

- **NLP Analysis**: Parses natural language to detect workflow intent and key actions
- **Pattern Recognition**: Identifies common workflow patterns (fetch-transform-save, analyze-report, etc.)
- **Tool Validation**: Checks if suggested tools are available from the provided list
- **Confidence Scoring**: Provides a confidence score (0-1) for the generated skeleton
- **Complexity Assessment**: Categorizes workflow as simple, moderate, or complex
- **Step Chaining**: Automatically chains step outputs to next step inputs

## Input Schema

```typescript
{
  prompt: string;              // Natural language workflow description
  availableTools?: string[];   // Optional list of available tool names
}
```

## Output Schema

```typescript
{
  skeleton: {
    name: string;              // Generated workflow name
    description: string;       // Workflow description (from prompt)
    steps: Array<{             // Generated workflow steps
      stepNumber: number;
      toolName: string;        // Suggested tool name
      purpose: string;         // What this step does
      estimatedInputs: string[];
      estimatedOutputs: string[];
      isAvailable: boolean;    // Whether tool is in availableTools list
    }>;
  };
  suggestedTools: Array<{      // Recommended tools with reasoning
    name: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    isAvailable: boolean;
  }>;
  confidence: number;          // 0-1 confidence score
  analysis: {
    detectedIntent: string;    // Detected workflow pattern
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedSteps: number;
    keyActions: string[];      // Extracted action verbs
  };
}
```

## Workflow Patterns

The tool recognizes common patterns:

- **fetch-transform-save**: Data extraction and storage pipelines
- **analyze-report**: Data analysis and reporting workflows
- **validate-action**: Validation and conditional execution
- **scrape-extract**: Web scraping and data extraction
- **email-notify**: Notification and messaging workflows
- **aggregate-filter**: Data aggregation and filtering

## Confidence Scoring

Confidence is calculated based on:
- Clarity of detected actions (base: 0.5, +0.2 if clear)
- Tool availability (+0.3 weighted by availability ratio)
- Complexity (bonus for 2-5 steps)

Higher confidence (>0.7) indicates the tool is confident about the generated skeleton.

## Example Use Cases

### Create workflow from scratch
```typescript
const result = await promptToWorkflowSkeletonTool.execute({
  prompt: 'Send a daily summary email with sales data',
});
// Suggests: fetch → aggregate → format → send
```

### Validate against available tools
```typescript
const result = await promptToWorkflowSkeletonTool.execute({
  prompt: 'Process images and generate thumbnails',
  availableTools: ['fetchImage', 'resizeImage', 'saveThumbnail'],
});
// Marks tools as available/unavailable
```

### Complex multi-step workflow
```typescript
const result = await promptToWorkflowSkeletonTool.execute({
  prompt: 'Scrape product data, validate prices, filter deals, notify users',
});
// Detects: scrape → validate → filter → notify pattern
```

## License

MIT

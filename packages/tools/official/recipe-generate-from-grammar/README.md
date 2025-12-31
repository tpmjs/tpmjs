# Recipe Generate from Grammar

Generate recipes following a grammar/template system with rules and optional seeding for deterministic generation.

## Installation

```bash
npm install @tpmjs/tools-recipe-generate-from-grammar
```

## Usage

```typescript
import { recipeGenerateFromGrammarTool } from '@tpmjs/tools-recipe-generate-from-grammar';

const result = await recipeGenerateFromGrammarTool.execute({
  grammar: {
    start: 'workflow',
    rules: {
      workflow: {
        steps: ['analyze', 'process', 'output']
      },
      analyze: ['parse data', 'validate input'],
      process: ['transform data', 'apply rules'],
      output: ['generate report', 'save results']
    }
  },
  seed: 'deterministic-seed' // Optional
});

console.log(result.recipe);
// {
//   name: 'workflow',
//   steps: [
//     { action: 'analyze', details: 'parse data', order: 0 },
//     { action: 'process', details: 'transform data', order: 1 },
//     { action: 'output', details: 'generate report', order: 2 }
//   ],
//   metadata: { generatedAt: '2025-01-01T00:00:00.000Z', grammarHash: 'abc123...' }
// }
```

## Grammar Format

The grammar is a structured object with:
- `start`: Name of the starting rule
- `rules`: Object mapping rule names to definitions

Rule definitions can be:
- **String**: A literal value or reference to another rule
- **Array**: Multiple alternatives (one will be randomly selected)
- **Object**: Nested structure that will be expanded

## Features

- Deterministic generation with optional seed
- Recursive rule expansion
- Support for nested grammar structures
- SHA-256 hash of grammar for tracking
- Automatic step extraction and ordering

## Examples

### Simple Linear Recipe

```typescript
const result = await recipeGenerateFromGrammarTool.execute({
  grammar: {
    start: 'recipe',
    rules: {
      recipe: {
        steps: [
          { action: 'prepare', details: 'gather ingredients' },
          { action: 'cook', details: 'apply heat' },
          { action: 'serve', details: 'plate and garnish' }
        ]
      }
    }
  }
});
```

### Branching Recipe with Alternatives

```typescript
const result = await recipeGenerateFromGrammarTool.execute({
  grammar: {
    start: 'deployment',
    rules: {
      deployment: {
        steps: ['build', 'test', 'deploy']
      },
      build: ['npm build', 'docker build'],
      test: ['unit tests', 'integration tests', 'e2e tests'],
      deploy: ['deploy to staging', 'deploy to production']
    }
  },
  seed: 'build-123' // Same seed = same output
});
```

## Use Cases

- Generating workflow templates
- Creating procedural recipes
- Building test scenarios
- Generating documentation structures
- Creating parameterized task lists

## License

MIT

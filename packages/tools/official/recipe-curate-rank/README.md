# Recipe Curate and Rank

Rank recipes by quality, efficiency, or custom criteria using weighted scoring.

## Installation

```bash
npm install @tpmjs/tools-recipe-curate-rank
```

## Usage

```typescript
import { recipeCurateRankTool } from '@tpmjs/tools-recipe-curate-rank';

const result = await recipeCurateRankTool.execute({
  recipes: [
    {
      name: 'Quick Deploy',
      steps: [
        { action: 'build', duration: 2 },
        { action: 'deploy', duration: 1 }
      ],
      complexity: 3,
      estimatedTime: 3
    },
    {
      name: 'Full CI/CD',
      steps: [
        { action: 'test', duration: 5 },
        { action: 'build', duration: 3 },
        { action: 'scan', duration: 2 },
        { action: 'deploy', duration: 2 }
      ],
      complexity: 7,
      estimatedTime: 12,
      metadata: { quality: 9 }
    }
  ],
  criteria: [
    { name: 'speed', weight: 0.6 },
    { name: 'quality', weight: 0.4 }
  ]
});

console.log(result.topPick);
// {
//   recipeName: 'Quick Deploy',
//   score: 0.85,
//   reason: 'Best overall score with strong speed (95%) and quality (60%)'
// }
```

## Ranking Criteria

Common criteria names (case-insensitive):
- **simplicity** - Favors recipes with fewer steps/lower complexity
- **complexity** - Favors more comprehensive recipes
- **speed** / **efficiency** - Favors faster recipes
- **quality** / **thoroughness** - Favors higher quality
- **completeness** - Favors recipes with more steps
- **reliability** / **robust** - Uses metadata or defaults to 0.7
- **innovation** / **creative** - Uses metadata or defaults to 0.5
- **cost** / **economical** - Favors lower cost recipes

You can also use custom criteria names that match recipe properties.

## Recipe Properties

Recipes can include:
- `name` (required) - Recipe identifier
- `steps` - Array of step objects with optional `duration`
- `complexity` - Numeric complexity score (1-10)
- `estimatedTime` - Total time in minutes
- `metadata` - Additional properties like `quality`, `reliability`, `innovation`, `cost`
- Any custom properties that match your criteria names

## Scoring System

Each criterion is:
1. Calculated as a 0-1 score based on recipe properties
2. Weighted by the criterion's weight value
3. Combined into a total score
4. Used to rank recipes in descending order

The tool automatically normalizes values and provides detailed score breakdowns.

## Examples

### Optimize for Speed Only

```typescript
const result = await recipeCurateRankTool.execute({
  recipes: [
    { name: 'A', estimatedTime: 5 },
    { name: 'B', estimatedTime: 15 },
    { name: 'C', estimatedTime: 10 }
  ],
  criteria: [{ name: 'speed', weight: 1.0 }]
});
// Top pick: 'A' (fastest)
```

### Balance Multiple Criteria

```typescript
const result = await recipeCurateRankTool.execute({
  recipes: [
    { name: 'Fast but risky', estimatedTime: 5, metadata: { reliability: 0.3 } },
    { name: 'Balanced', estimatedTime: 10, metadata: { reliability: 0.8 } },
    { name: 'Slow but safe', estimatedTime: 20, metadata: { reliability: 0.95 } }
  ],
  criteria: [
    { name: 'speed', weight: 0.4 },
    { name: 'reliability', weight: 0.6 }
  ]
});
// Top pick: 'Balanced' (best combination)
```

### Custom Criteria

```typescript
const result = await recipeCurateRankTool.execute({
  recipes: [
    { name: 'Recipe A', customScore: 85 },
    { name: 'Recipe B', customScore: 92 },
    { name: 'Recipe C', customScore: 78 }
  ],
  criteria: [{ name: 'customScore', weight: 1.0 }]
});
// Top pick: 'Recipe B' (highest custom score)
```

## Output Structure

```typescript
{
  ranked: [
    {
      recipe: { name: '...' },
      score: 0.85,
      rank: 1,
      breakdown: { speed: 0.9, quality: 0.8 }
    }
  ],
  scores: [
    {
      recipeName: '...',
      totalScore: 0.85,
      breakdown: { speed: 0.9, quality: 0.8 }
    }
  ],
  topPick: {
    recipeName: '...',
    score: 0.85,
    reason: 'Best overall score with strong speed (90%)'
  }
}
```

## Use Cases

- Selecting optimal deployment strategies
- Comparing workflow efficiency
- Evaluating automation recipes
- Choosing test strategies
- Prioritizing task execution plans

## License

MIT

/**
 * Recipe Curate and Rank Tool for TPMJS
 * Ranks recipes by quality/efficiency using weighted criteria
 *
 * @requires Node.js 18+
 */

import { createHash } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

/**
 * Recipe structure
 */
export interface Recipe {
  id?: string;
  name: string;
  steps?: Array<{
    action: string;
    details?: string;
    duration?: number;
  }>;
  complexity?: number;
  estimatedTime?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Ranking criterion with name and weight
 */
export interface RankingCriterion {
  name: string;
  weight: number;
}

/**
 * Recipe with calculated score
 */
export interface RankedRecipe {
  recipe: Recipe;
  score: number;
  rank: number;
  breakdown: Record<string, number>;
}

/**
 * Output interface for recipe ranking
 */
export interface RecipeRankResult {
  ranked: RankedRecipe[];
  scores: Array<{
    recipeName: string;
    totalScore: number;
    breakdown: Record<string, number>;
  }>;
  topPick: {
    recipeName: string;
    score: number;
    reason: string;
  };
}

type RecipeRankInput = {
  recipes: Recipe[];
  criteria: RankingCriterion[];
};

/**
 * Validates criteria structure and weights
 */
function validateCriteria(criteria: RankingCriterion[]): void {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error('Criteria must be a non-empty array');
  }

  for (const criterion of criteria) {
    if (!criterion.name || typeof criterion.name !== 'string') {
      throw new Error('Each criterion must have a name string');
    }
    if (typeof criterion.weight !== 'number' || criterion.weight < 0) {
      throw new Error('Each criterion weight must be a non-negative number');
    }
  }

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) {
    throw new Error('Total weight of all criteria must be greater than 0');
  }
}

/**
 * Validates recipes array
 */
function validateRecipes(recipes: Recipe[]): void {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    throw new Error('Recipes must be a non-empty array');
  }

  for (const recipe of recipes) {
    if (!recipe.name || typeof recipe.name !== 'string') {
      throw new Error('Each recipe must have a name string');
    }
  }
}

/**
 * Calculates hash for a recipe to enable deduplication
 * Domain rule: recipe_deduplication - Generate deterministic hash from canonical recipe representation
 */
function calculateRecipeHash(recipe: Recipe): string {
  // Create a canonical representation for hashing
  // Domain rule: canonical_recipe_format - Use name and steps only for hash consistency
  const canonical = {
    name: recipe.name,
    steps: recipe.steps?.map((s) => ({ action: s.action, details: s.details })) || [],
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex').substring(0, 16);
}

/**
 * Deduplicates recipes by hash
 */
function deduplicateRecipes(recipes: Recipe[]): Recipe[] {
  const seen = new Set<string>();
  const unique: Recipe[] = [];

  for (const recipe of recipes) {
    const hash = calculateRecipeHash(recipe);
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(recipe);
    }
  }

  return unique;
}

/**
 * Normalizes a value to 0-1 range using min-max normalization
 */
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Calculates score for a criterion based on recipe properties
 */
function calculateCriterionScore(recipe: Recipe, criterionName: string): number {
  const name = criterionName.toLowerCase();

  // Complexity: lower is better (inverse)
  if (name.includes('simplicity') || name === 'simple') {
    const complexity = recipe.complexity ?? recipe.steps?.length ?? 5;
    return 1 - normalizeValue(complexity, 1, 10);
  }

  if (name.includes('complexity')) {
    const complexity = recipe.complexity ?? recipe.steps?.length ?? 5;
    return normalizeValue(complexity, 1, 10);
  }

  // Speed/efficiency: lower time is better (inverse)
  if (name.includes('speed') || name.includes('efficiency') || name.includes('fast')) {
    const time =
      recipe.estimatedTime ?? recipe.steps?.reduce((sum, s) => sum + (s.duration ?? 1), 0) ?? 5;
    return 1 - normalizeValue(time, 1, 100);
  }

  // Quality: use metadata quality or step count as proxy
  if (name.includes('quality') || name.includes('thoroughness')) {
    const quality = recipe.metadata?.quality ?? recipe.steps?.length ?? 5;
    return normalizeValue(quality, 1, 10);
  }

  // Completeness: number of steps
  if (name.includes('complete') || name.includes('comprehensive')) {
    const stepCount = recipe.steps?.length ?? 1;
    return normalizeValue(stepCount, 1, 20);
  }

  // Reliability: use metadata or default to neutral
  if (name.includes('reliability') || name.includes('robust')) {
    return recipe.metadata?.reliability ?? 0.7;
  }

  // Innovation/novelty
  if (name.includes('innovation') || name.includes('novel') || name.includes('creative')) {
    return recipe.metadata?.innovation ?? 0.5;
  }

  // Cost effectiveness: lower is better (inverse)
  if (name.includes('cost') || name.includes('economical')) {
    const cost = recipe.metadata?.cost ?? 5;
    return 1 - normalizeValue(cost, 1, 10);
  }

  // Default: check if recipe has a matching property
  if (recipe[criterionName] !== undefined) {
    const value = recipe[criterionName];
    if (typeof value === 'number') {
      return normalizeValue(value, 0, 100);
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
  }

  // Default neutral score
  return 0.5;
}

/**
 * Ranks recipes based on weighted criteria
 * Domain rule: weighted_ranking - Calculate weighted scores from multiple criteria with normalized weights
 */
function rankRecipes(recipes: Recipe[], criteria: RankingCriterion[]): RankedRecipe[] {
  // Domain rule: weight_normalization - Normalize weights to sum to 1.0 for consistent scoring
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const scored = recipes.map((recipe) => {
    const breakdown: Record<string, number> = {};
    let totalScore = 0;

    for (const criterion of criteria) {
      const rawScore = calculateCriterionScore(recipe, criterion.name);
      const weightedScore = rawScore * (criterion.weight / totalWeight);
      breakdown[criterion.name] = rawScore;
      totalScore += weightedScore;
    }

    return {
      recipe,
      score: totalScore,
      rank: 0, // Will be assigned after sorting
      breakdown,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}

/**
 * Generates reason for top pick
 */
function generateTopPickReason(topRecipe: RankedRecipe): string {
  const strengths: string[] = [];

  // Find top 2 criteria scores
  const sortedBreakdown = Object.entries(topRecipe.breakdown).sort((a, b) => b[1] - a[1]);

  for (let i = 0; i < Math.min(2, sortedBreakdown.length); i++) {
    const entry = sortedBreakdown[i];
    if (entry) {
      const [criterionName, score] = entry;
      if (score > 0.7) {
        strengths.push(`strong ${criterionName} (${(score * 100).toFixed(0)}%)`);
      }
    }
  }

  if (strengths.length > 0) {
    return `Best overall score with ${strengths.join(' and ')}`;
  }

  return 'Best overall score across all criteria';
}

/**
 * Recipe Curate and Rank Tool
 * Ranks recipes by quality/efficiency using weighted criteria
 */
export const recipeCurateRankTool = tool({
  description:
    'Rank multiple recipes by quality, efficiency, or custom criteria. Each criterion has a weight that determines its importance. Returns ranked list with scores and identifies the top pick.',
  inputSchema: jsonSchema<RecipeRankInput>({
    type: 'object',
    properties: {
      recipes: {
        type: 'array',
        description: 'Array of recipe objects to rank',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Recipe name (required)',
            },
            steps: {
              type: 'array',
              description: 'Optional array of steps',
              items: {
                type: 'object',
              },
            },
            complexity: {
              type: 'number',
              description: 'Optional complexity score (1-10)',
            },
            estimatedTime: {
              type: 'number',
              description: 'Optional estimated time in minutes',
            },
          },
          required: ['name'],
        },
      },
      criteria: {
        type: 'array',
        description:
          'Array of ranking criteria. Common criteria: simplicity, speed, quality, completeness, reliability, innovation, cost',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Criterion name (e.g., "quality", "speed", "simplicity")',
            },
            weight: {
              type: 'number',
              description: 'Weight for this criterion (higher = more important)',
            },
          },
          required: ['name', 'weight'],
        },
      },
    },
    required: ['recipes', 'criteria'],
    additionalProperties: false,
  }),
  async execute({ recipes, criteria }): Promise<RecipeRankResult> {
    // Validate inputs
    validateRecipes(recipes);
    validateCriteria(criteria);

    // Deduplicate recipes by hash
    const uniqueRecipes = deduplicateRecipes(recipes);

    // Rank the recipes
    const ranked = rankRecipes(uniqueRecipes, criteria);

    // Build scores array
    const scores = ranked.map((r) => ({
      recipeName: r.recipe.name,
      totalScore: r.score,
      breakdown: r.breakdown,
    }));

    // Identify top pick
    const topRecipe = ranked[0];
    if (!topRecipe) {
      throw new Error('No recipes to rank');
    }

    const topPick = {
      recipeName: topRecipe.recipe.name,
      score: topRecipe.score,
      reason: generateTopPickReason(topRecipe),
    };

    return {
      ranked,
      scores,
      topPick,
    };
  },
});

export default recipeCurateRankTool;

/**
 * Recipe Generate from Grammar Tool for TPMJS
 * Generates recipes following a grammar/template system with rules
 *
 * @requires Node.js 18+
 */

import { createHash } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

/**
 * Grammar rule can be a string or array of alternatives or nested object
 */
export type GrammarRule = string | string[] | Record<string, any>;

/**
 * Grammar definition with named rules
 */
export interface Grammar {
  start: string;
  rules: Record<string, GrammarRule>;
}

/**
 * Generated recipe structure
 */
export interface Recipe {
  name: string;
  steps: Array<{
    action: string;
    details: string;
    order: number;
  }>;
  metadata: {
    generatedAt: string;
    grammarHash: string;
  };
}

/**
 * Output interface for recipe generation
 */
export interface RecipeGenerateResult {
  recipe: Recipe;
  stepsGenerated: number;
  grammarUsed: string;
}

type RecipeGenerateInput = {
  grammar: Grammar;
  seed?: string;
};

/**
 * Validates grammar structure
 */
function validateGrammar(grammar: Grammar): void {
  if (!grammar.start || typeof grammar.start !== 'string') {
    throw new Error('Grammar must have a "start" rule name');
  }

  if (!grammar.rules || typeof grammar.rules !== 'object') {
    throw new Error('Grammar must have a "rules" object');
  }

  if (!grammar.rules[grammar.start]) {
    throw new Error(`Start rule "${grammar.start}" not found in grammar rules`);
  }
}

/**
 * Creates a deterministic random number generator from seed
 */
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  return () => {
    hash = (hash * 1664525 + 1013904223) | 0;
    return (hash >>> 0) / 4294967296;
  };
}

/**
 * Expands a grammar rule into a concrete value
 */
function expandRule(ruleName: string, grammar: Grammar, random: () => number, depth = 0): string {
  // Prevent infinite recursion
  if (depth > 20) {
    return ruleName;
  }

  const rule = grammar.rules[ruleName];

  if (!rule) {
    // If rule doesn't exist, return the literal
    return ruleName;
  }

  // String rule - check if it references another rule
  if (typeof rule === 'string') {
    if (grammar.rules[rule]) {
      return expandRule(rule, grammar, random, depth + 1);
    }
    return rule;
  }

  // Array rule - pick random alternative
  if (Array.isArray(rule)) {
    const index = Math.floor(random() * rule.length);
    const selected = rule[index];

    // If selected is a reference to another rule
    if (typeof selected === 'string' && grammar.rules[selected]) {
      return expandRule(selected, grammar, random, depth + 1);
    }

    return selected;
  }

  // Object rule - expand each property
  if (typeof rule === 'object') {
    const expanded: Record<string, string> = {};
    for (const [key, value] of Object.entries(rule)) {
      if (typeof value === 'string') {
        expanded[key] = grammar.rules[value]
          ? expandRule(value, grammar, random, depth + 1)
          : value;
      } else if (Array.isArray(value)) {
        const index = Math.floor(random() * value.length);
        const selected = value[index];
        expanded[key] = typeof selected === 'string' ? selected : JSON.stringify(selected);
      } else {
        expanded[key] = JSON.stringify(value);
      }
    }
    return JSON.stringify(expanded);
  }

  return String(rule);
}

/**
 * Generates a recipe from grammar
 */
function generateRecipeFromGrammar(grammar: Grammar, seed?: string): Recipe {
  const random = seed ? createSeededRandom(seed) : Math.random;
  const grammarHash = createHash('sha256').update(JSON.stringify(grammar)).digest('hex');

  // Expand the start rule
  const expanded = expandRule(grammar.start, grammar, random);

  // Parse the expanded result to extract steps
  let steps: Array<{ action: string; details: string; order: number }> = [];

  try {
    // Try to parse as JSON if it's an object
    const parsed = JSON.parse(expanded);

    if (parsed.steps && Array.isArray(parsed.steps)) {
      steps = parsed.steps.map((step: any, index: number) => ({
        action: step.action || `Step ${index + 1}`,
        details: step.details || step.description || '',
        order: index,
      }));
    } else {
      // Convert object properties to steps
      steps = Object.entries(parsed).map(([key, value], index) => ({
        action: key,
        details: String(value),
        order: index,
      }));
    }
  } catch {
    // If not JSON, treat as single step
    steps = [
      {
        action: 'Execute',
        details: expanded,
        order: 0,
      },
    ];
  }

  return {
    name: grammar.start,
    steps,
    metadata: {
      generatedAt: new Date().toISOString(),
      grammarHash: grammarHash.substring(0, 16),
    },
  };
}

/**
 * Recipe Generate from Grammar Tool
 * Generates recipes following a grammar template with rules
 */
export const recipeGenerateFromGrammarTool = tool({
  description:
    'Generate recipes following a grammar/template with rules. Useful for creating structured workflows or recipes from a formal grammar definition. Supports optional seeding for deterministic generation.',
  inputSchema: jsonSchema<RecipeGenerateInput>({
    type: 'object',
    properties: {
      grammar: {
        type: 'object',
        description:
          'Grammar definition with "start" rule name and "rules" object mapping rule names to values (strings, arrays of alternatives, or nested objects)',
        properties: {
          start: {
            type: 'string',
            description: 'Name of the starting rule to expand',
          },
          rules: {
            type: 'object',
            description: 'Map of rule names to their definitions',
            additionalProperties: true,
          },
        },
        required: ['start', 'rules'],
      },
      seed: {
        type: 'string',
        description: 'Optional seed string for deterministic generation',
      },
    },
    required: ['grammar'],
    additionalProperties: false,
  }),
  async execute({ grammar, seed }): Promise<RecipeGenerateResult> {
    // Validate inputs
    validateGrammar(grammar);

    // Generate the recipe
    const recipe = generateRecipeFromGrammar(grammar, seed);

    return {
      recipe,
      stepsGenerated: recipe.steps.length,
      grammarUsed: grammar.start,
    };
  },
});

export default recipeGenerateFromGrammarTool;

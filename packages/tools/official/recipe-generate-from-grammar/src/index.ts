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
  recipes: Recipe[];
  count: number;
  templatesUsed: string[];
}

type RecipeGenerateInput = {
  templates: Array<{ name: string; pattern: string }>;
  catalog: Array<{ id: string; name: string; category: string }>;
  n: number;
};

/**
 * Expands a workflow template into concrete recipe using the Acquire→Extract→Analyze→Output pattern
 * Domain rule: workflow_pattern - Follow standard Acquire→Extract→Analyze→Output workflow structure
 */
function expandTemplate(
  template: { name: string; pattern: string },
  catalog: Array<{ id: string; name: string; category: string }>,
  random: () => number
): Recipe {
  const steps: Array<{ action: string; details: string; order: number }> = [];

  // Domain rule: aeao_pattern - Acquire→Extract→Analyze→Output is the standard workflow pattern
  const pattern = ['Acquire', 'Extract', 'Analyze', 'Output'];

  for (let i = 0; i < pattern.length; i++) {
    const phase = pattern[i]!;

    // Domain rule: category_matching - Match tools to workflow phases by category keywords
    const matchingTools = catalog.filter((tool) => {
      const category = tool.category?.toLowerCase() || '';
      return (
        category.includes(phase.toLowerCase()) ||
        (phase === 'Acquire' && (category.includes('fetch') || category.includes('get'))) ||
        (phase === 'Extract' && (category.includes('parse') || category.includes('extract'))) ||
        (phase === 'Analyze' && (category.includes('analyze') || category.includes('compute'))) ||
        (phase === 'Output' && (category.includes('output') || category.includes('save')))
      );
    });

    // Select a random tool from matching category, or use generic if none match
    let selectedTool = 'genericTool';
    let details = `Perform ${phase} operation`;

    if (matchingTools.length > 0) {
      const index = Math.floor(random() * matchingTools.length);
      const tool = matchingTools[index];
      if (tool) {
        selectedTool = tool.name;
        details = `${phase} using ${tool.name}`;
      }
    }

    steps.push({
      action: selectedTool,
      details,
      order: i,
    });
  }

  return {
    name: template.name,
    steps,
    metadata: {
      generatedAt: new Date().toISOString(),
      grammarHash: createHash('sha256').update(template.pattern).digest('hex').substring(0, 16),
    },
  };
}

/**
 * Creates a deterministic random number generator from seed
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

/**
 * Recipe Generate from Grammar Tool
 * Generates recipes following the Acquire→Extract→Analyze→Output pattern
 */
export const recipeGenerateFromGrammarTool = tool({
  description:
    'Expands workflow templates into concrete recipes using grammar rules. Follows the Acquire→Extract→Analyze→Output pattern, fills slots from tool catalog, and samples to requested count.',
  inputSchema: jsonSchema<RecipeGenerateInput>({
    type: 'object',
    properties: {
      templates: {
        type: 'array',
        description: 'Workflow templates to expand',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            pattern: { type: 'string' },
          },
          required: ['name', 'pattern'],
        },
      },
      catalog: {
        type: 'array',
        description: 'Tool catalog for slot filling',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            category: { type: 'string' },
          },
          required: ['id', 'name', 'category'],
        },
      },
      n: {
        type: 'number',
        description: 'Number of recipes to generate',
      },
    },
    required: ['templates', 'catalog', 'n'],
    additionalProperties: false,
  }),
  async execute({ templates, catalog, n }): Promise<RecipeGenerateResult> {
    // Validate inputs
    if (!Array.isArray(templates) || templates.length === 0) {
      throw new Error('Templates must be a non-empty array');
    }
    if (!Array.isArray(catalog)) {
      throw new Error('Catalog must be an array');
    }
    if (typeof n !== 'number' || n < 1 || n > 100) {
      throw new Error('n must be a number between 1 and 100');
    }

    // Generate recipes by sampling templates
    const recipes: Recipe[] = [];
    const templatesUsed: string[] = [];

    for (let i = 0; i < n; i++) {
      const templateIndex = i % templates.length;
      const template = templates[templateIndex]!;
      const random = createSeededRandom(i * 12345);

      const recipe = expandTemplate(template, catalog, random);
      recipes.push(recipe);

      if (!templatesUsed.includes(template.name)) {
        templatesUsed.push(template.name);
      }
    }

    return {
      recipes,
      count: recipes.length,
      templatesUsed,
    };
  },
});

export default recipeGenerateFromGrammarTool;

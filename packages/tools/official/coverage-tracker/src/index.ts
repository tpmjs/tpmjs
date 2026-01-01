/**
 * Coverage Tracker Tool for TPMJS
 * Tracks coverage across domains, artifacts, and roles for recipe library.
 *
 * Domain Rules:
 * - Must compute coverage by category
 * - Must identify uncovered areas
 * - Must provide distribution data (histograms)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a recipe with category information
 */
export interface Recipe {
  id: string;
  name: string;
  category?: string; // e.g., "research", "doc", "web", "agent"
  domain?: string; // e.g., "marketing", "engineering", "finance"
  artifact?: string; // e.g., "brief", "report", "workflow"
  role?: string; // e.g., "analyst", "developer", "manager"
  [key: string]: unknown;
}

/**
 * Coverage metrics for a specific category
 */
export interface CategoryCoverage {
  category: string;
  count: number;
  percentage: number;
}

/**
 * Distribution data (histogram) for a dimension
 */
export interface DistributionData {
  label: string;
  count: number;
  percentage: number;
}

/**
 * Output interface for coverage tracking (domain rule: detailed coverage)
 */
export interface CoverageReport {
  totalRecipes: number;
  coverageByCategory: CategoryCoverage[]; // domain rule: coverage by category
  uncoveredCategories: string[]; // domain rule: identify uncovered areas
  distributions: {
    // domain rule: provide distribution data (histograms)
    byCategory: DistributionData[];
    byDomain: DistributionData[];
    byArtifact: DistributionData[];
    byRole: DistributionData[];
  };
  summary: string;
}

type CoverageTrackerInput = {
  recipes: Recipe[];
  expectedCategories?: string[]; // Optional list of categories that should be covered
};

/**
 * Computes distribution histogram for a dimension
 */
function computeDistribution(recipes: Recipe[], field: keyof Recipe): DistributionData[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const recipe of recipes) {
    const value = recipe[field];
    if (typeof value === 'string' && value.trim()) {
      counts.set(value, (counts.get(value) || 0) + 1);
      total++;
    }
  }

  const distribution: DistributionData[] = [];
  for (const [label, count] of counts.entries()) {
    distribution.push({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 1000 : 0,
    });
  }

  // Sort by count descending
  distribution.sort((a, b) => b.count - a.count);

  return distribution;
}

/**
 * Computes coverage by category (domain rule)
 */
function computeCoverageByCategory(
  recipes: Recipe[],
  expectedCategories?: string[]
): {
  coverageByCategory: CategoryCoverage[];
  uncoveredCategories: string[];
} {
  const categoryCounts = new Map<string, number>();

  // Count recipes in each category
  for (const recipe of recipes) {
    if (recipe.category) {
      categoryCounts.set(recipe.category, (categoryCounts.get(recipe.category) || 0) + 1);
    }
  }

  // Build coverage array
  const coverageByCategory: CategoryCoverage[] = [];
  const totalRecipes = recipes.length;

  for (const [category, count] of categoryCounts.entries()) {
    coverageByCategory.push({
      category,
      count,
      percentage: totalRecipes > 0 ? Math.round((count / totalRecipes) * 1000) / 1000 : 0,
    });
  }

  // Sort by count descending
  coverageByCategory.sort((a, b) => b.count - a.count);

  // Identify uncovered categories (domain rule)
  const uncoveredCategories: string[] = [];
  if (expectedCategories && expectedCategories.length > 0) {
    const coveredCategories = new Set(categoryCounts.keys());
    for (const expected of expectedCategories) {
      if (!coveredCategories.has(expected)) {
        uncoveredCategories.push(expected);
      }
    }
  }

  return { coverageByCategory, uncoveredCategories };
}

/**
 * Coverage Tracker Tool
 * Tracks coverage across categories, domains, and artifacts for recipe library
 */
export const coverageTrackerTool = tool({
  description:
    'Tracks coverage across categories, domains, artifacts, and roles for a recipe library. Computes coverage by category, identifies uncovered areas, and provides distribution data (histograms) for analysis.',
  inputSchema: jsonSchema<CoverageTrackerInput>({
    type: 'object',
    properties: {
      recipes: {
        type: 'array',
        description: 'Array of recipes with category, domain, artifact, and role metadata',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique recipe ID',
            },
            name: {
              type: 'string',
              description: 'Recipe name',
            },
            category: {
              type: 'string',
              description: 'Recipe category (e.g., "research", "doc", "web", "agent")',
            },
            domain: {
              type: 'string',
              description: 'Domain (e.g., "marketing", "engineering", "finance")',
            },
            artifact: {
              type: 'string',
              description: 'Artifact type (e.g., "brief", "report", "workflow")',
            },
            role: {
              type: 'string',
              description: 'Target role (e.g., "analyst", "developer", "manager")',
            },
          },
          required: ['id', 'name'],
        },
      },
      expectedCategories: {
        type: 'array',
        description: 'Optional list of categories that should be covered',
        items: {
          type: 'string',
        },
      },
    },
    required: ['recipes'],
    additionalProperties: false,
  }),
  async execute({ recipes, expectedCategories }): Promise<CoverageReport> {
    // Validate input
    if (!Array.isArray(recipes)) {
      throw new Error('Invalid recipes: must be an array');
    }

    if (recipes.length === 0) {
      return {
        totalRecipes: 0,
        coverageByCategory: [],
        uncoveredCategories: expectedCategories || [],
        distributions: {
          byCategory: [],
          byDomain: [],
          byArtifact: [],
          byRole: [],
        },
        summary: 'No recipes provided',
      };
    }

    // Validate recipe structure
    for (const recipe of recipes) {
      if (!recipe.id || !recipe.name) {
        throw new Error('Invalid recipe: each recipe must have id and name');
      }
    }

    // Compute coverage by category (domain rule)
    const { coverageByCategory, uncoveredCategories } = computeCoverageByCategory(
      recipes,
      expectedCategories
    );

    // Compute distributions (domain rule: histograms)
    const distributions = {
      byCategory: computeDistribution(recipes, 'category'),
      byDomain: computeDistribution(recipes, 'domain'),
      byArtifact: computeDistribution(recipes, 'artifact'),
      byRole: computeDistribution(recipes, 'role'),
    };

    // Generate summary
    const totalRecipes = recipes.length;
    const categoriesCount = coverageByCategory.length;
    const topCategory = coverageByCategory[0];

    const summaryParts = [`Total recipes: ${totalRecipes}`, `Categories: ${categoriesCount}`];

    if (topCategory) {
      summaryParts.push(
        `Top category: ${topCategory.category} (${topCategory.count} recipes, ${(topCategory.percentage * 100).toFixed(1)}%)`
      );
    }

    if (uncoveredCategories.length > 0) {
      summaryParts.push(
        `Uncovered: ${uncoveredCategories.slice(0, 3).join(', ')}${uncoveredCategories.length > 3 ? '...' : ''}`
      );
    }

    const summary = summaryParts.join(' | ');

    return {
      totalRecipes,
      coverageByCategory,
      uncoveredCategories,
      distributions,
      summary,
    };
  },
});

export default coverageTrackerTool;

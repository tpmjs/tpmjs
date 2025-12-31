/**
 * Test Plan Matrix Tool for TPMJS
 * Creates a test coverage matrix showing which features are covered by which test types.
 * Useful for QA planning and identifying test coverage gaps.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Matrix cell representing test coverage status
 */
export interface MatrixCell {
  feature: string;
  testType: string;
  covered: boolean;
}

/**
 * Coverage statistics for a feature
 */
export interface CoverageStats {
  feature: string;
  coveredTypes: string[];
  coveragePercentage: number;
}

/**
 * Coverage gap in the test plan
 */
export interface CoverageGap {
  feature: string;
  missingTestTypes: string[];
}

/**
 * Output interface for test plan matrix
 */
export interface TestPlanMatrixResult {
  matrix: MatrixCell[][];
  coverage: CoverageStats[];
  gaps: CoverageGap[];
}

type TestPlanMatrixInput = {
  features: string[];
  testTypes: string[];
  coverage?: Record<string, string[]>;
};

/**
 * Builds the test coverage matrix
 */
function buildMatrix(
  features: string[],
  testTypes: string[],
  coverage: Record<string, string[]>
): MatrixCell[][] {
  const matrix: MatrixCell[][] = [];

  for (const feature of features) {
    const row: MatrixCell[] = [];
    const coveredTypes = coverage[feature] || [];

    for (const testType of testTypes) {
      row.push({
        feature,
        testType,
        covered: coveredTypes.includes(testType),
      });
    }

    matrix.push(row);
  }

  return matrix;
}

/**
 * Calculates coverage statistics for each feature
 */
function calculateCoverage(
  features: string[],
  testTypes: string[],
  coverage: Record<string, string[]>
): CoverageStats[] {
  return features.map((feature) => {
    const coveredTypes = coverage[feature] || [];
    const coveragePercentage =
      testTypes.length > 0 ? Math.round((coveredTypes.length / testTypes.length) * 100) : 0;

    return {
      feature,
      coveredTypes,
      coveragePercentage,
    };
  });
}

/**
 * Identifies coverage gaps (features missing test types)
 */
function identifyGaps(
  features: string[],
  testTypes: string[],
  coverage: Record<string, string[]>
): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  for (const feature of features) {
    const coveredTypes = coverage[feature] || [];
    const missingTestTypes = testTypes.filter((type) => !coveredTypes.includes(type));

    if (missingTestTypes.length > 0) {
      gaps.push({
        feature,
        missingTestTypes,
      });
    }
  }

  return gaps;
}

/**
 * Test Plan Matrix Tool
 * Creates a comprehensive test coverage matrix
 */
export const testPlanMatrixTool = tool({
  description:
    'Creates a test plan matrix showing coverage of features by test types. Takes a list of features, test types, and optional coverage mapping. Returns a matrix showing which features are covered by which test types, coverage statistics, and identifies gaps where features lack certain test types.',
  inputSchema: jsonSchema<TestPlanMatrixInput>({
    type: 'object',
    properties: {
      features: {
        type: 'array',
        description: 'List of features to test',
        items: {
          type: 'string',
        },
      },
      testTypes: {
        type: 'array',
        description: 'List of test types (e.g., unit, integration, e2e, performance)',
        items: {
          type: 'string',
        },
      },
      coverage: {
        type: 'object',
        description:
          'Optional coverage mapping. Keys are feature names, values are arrays of test types that cover that feature.',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
    required: ['features', 'testTypes'],
    additionalProperties: false,
  }),
  async execute({ features, testTypes, coverage = {} }): Promise<TestPlanMatrixResult> {
    // Validate inputs
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('features is required and must be a non-empty array');
    }

    if (!Array.isArray(testTypes) || testTypes.length === 0) {
      throw new Error('testTypes is required and must be a non-empty array');
    }

    // Validate coverage mapping
    if (coverage) {
      for (const [feature, types] of Object.entries(coverage)) {
        if (!features.includes(feature)) {
          throw new Error(`Coverage mapping includes unknown feature: ${feature}`);
        }
        if (!Array.isArray(types)) {
          throw new Error(`Coverage for feature "${feature}" must be an array`);
        }
        for (const type of types) {
          if (!testTypes.includes(type)) {
            throw new Error(
              `Coverage for feature "${feature}" includes unknown test type: ${type}`
            );
          }
        }
      }
    }

    const matrix = buildMatrix(features, testTypes, coverage);
    const coverageStats = calculateCoverage(features, testTypes, coverage);
    const gaps = identifyGaps(features, testTypes, coverage);

    return {
      matrix,
      coverage: coverageStats,
      gaps,
    };
  },
});

export default testPlanMatrixTool;

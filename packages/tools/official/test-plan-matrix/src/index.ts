/**
 * Test Plan Matrix Tool for TPMJS
 * Creates a test coverage matrix showing which features are covered by which test types.
 * Useful for QA planning and identifying test coverage gaps.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Test scenario with detailed steps
 */
export interface TestScenario {
  feature: string;
  testType: string;
  scenario: string;
  steps: string[];
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Matrix cell representing test coverage status
 */
export interface MatrixCell {
  feature: string;
  testType: string;
  covered: boolean;
  scenario?: TestScenario;
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
 * Generates a test scenario for a feature and test type combination
 */
function generateScenario(feature: string, testType: string): TestScenario {
  // Determine priority based on test type and feature importance
  let priority: 'high' | 'medium' | 'low';

  // Core test types are high priority
  if (testType === 'unit' || testType === 'integration' || testType === 'e2e') {
    priority = 'high';
  } else if (testType === 'smoke' || testType === 'regression' || testType === 'security') {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // Generate scenario description based on test type
  const scenarioTemplates: Record<string, string> = {
    unit: `Verify ${feature} functionality at the unit level`,
    integration: `Test ${feature} integration with dependent services`,
    e2e: `Validate ${feature} end-to-end user workflow`,
    smoke: `Quick smoke test of ${feature} core functionality`,
    regression: `Ensure ${feature} hasn't regressed from previous versions`,
    performance: `Measure ${feature} performance under load`,
    security: `Verify ${feature} security controls and access`,
    accessibility: `Test ${feature} accessibility compliance`,
    compatibility: `Verify ${feature} cross-browser/platform compatibility`,
  };

  const scenario = scenarioTemplates[testType] || `Test ${feature} with ${testType} testing`;

  // Generate detailed steps based on test type
  const steps: string[] = [];

  if (testType === 'unit') {
    steps.push('Set up test fixtures and mocks');
    steps.push(`Call ${feature} function/method with valid inputs`);
    steps.push('Assert expected outputs and side effects');
    steps.push('Test edge cases and error conditions');
  } else if (testType === 'integration') {
    steps.push('Set up test environment with required services');
    steps.push(`Invoke ${feature} integration points`);
    steps.push('Verify data flow between components');
    steps.push('Clean up test data and resources');
  } else if (testType === 'e2e') {
    steps.push('Navigate to feature entry point');
    steps.push(`Interact with ${feature} user interface`);
    steps.push('Complete user workflow from start to finish');
    steps.push('Verify final state and data persistence');
  } else if (testType === 'performance') {
    steps.push('Set up performance monitoring tools');
    steps.push(`Execute ${feature} under simulated load`);
    steps.push('Measure response times and resource usage');
    steps.push('Compare against performance baselines');
  } else if (testType === 'security') {
    steps.push(`Identify security-critical areas of ${feature}`);
    steps.push('Attempt unauthorized access scenarios');
    steps.push('Verify input validation and sanitization');
    steps.push('Test authentication and authorization controls');
  } else {
    steps.push(`Prepare test environment for ${feature}`);
    steps.push(`Execute ${testType} test procedures`);
    steps.push('Verify results match expected behavior');
    steps.push('Document findings and cleanup');
  }

  // Generate expected result based on test type
  const expectedResults: Record<string, string> = {
    unit: `${feature} unit tests pass with 100% code coverage`,
    integration: `${feature} successfully integrates with all dependencies`,
    e2e: `User can complete ${feature} workflow without errors`,
    performance: `${feature} meets performance SLAs (response time < threshold)`,
    security: `${feature} passes security scan with no critical vulnerabilities`,
    smoke: `${feature} core functionality is operational`,
    regression: `${feature} behavior matches previous version baseline`,
    accessibility: `${feature} meets WCAG 2.1 AA accessibility standards`,
    compatibility: `${feature} works correctly across all supported platforms`,
  };

  const expectedResult =
    expectedResults[testType] || `${feature} passes ${testType} testing criteria`;

  return {
    feature,
    testType,
    scenario,
    steps,
    expectedResult,
    priority,
  };
}

/**
 * Builds the test coverage matrix with generated scenarios
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
      const covered = coveredTypes.includes(testType);
      const scenario = covered ? generateScenario(feature, testType) : undefined;

      row.push({
        feature,
        testType,
        covered,
        scenario,
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
 * Creates a comprehensive test coverage matrix with generated test scenarios
 */
export const testPlanMatrixTool = tool({
  description:
    'Generates a QA test plan matrix with test scenarios, detailed steps, expected results, and priority assignments. For each feature/test-type combination, generates specific test scenarios with step-by-step instructions and assigns priorities (high/medium/low) based on test criticality. Identifies coverage gaps and provides statistics. Perfect for QA planning and ensuring comprehensive test coverage.',
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

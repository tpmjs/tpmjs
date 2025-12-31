/**
 * Eval Fixture Build Tool for TPMJS
 * Generates structured test fixtures for evaluating AI tool performance.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Represents a single test fixture
 */
export interface EvalFixture {
  id: string;
  input: unknown;
  expectedOutput: unknown;
  metadata?: {
    testType?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
    description?: string;
  };
}

/**
 * Result of building evaluation fixtures
 */
export interface EvalFixtureResult {
  fixtures: EvalFixture[];
  count: number;
  format: {
    inputTypes: string[];
    outputTypes: string[];
    complexity: 'simple' | 'moderate' | 'complex';
  };
  statistics?: {
    validFixtures: number;
    invalidFixtures: number;
    coverageScore: number;
  };
  recommendations?: string[];
}

type EvalFixtureBuildInput = {
  toolName: string;
  inputs: unknown[];
  expectedOutputs: unknown[];
};

/**
 * Determines the type of a value for categorization
 */
function determineType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

/**
 * Analyzes input complexity
 */
function analyzeComplexity(value: unknown): number {
  const type = determineType(value);

  if (type === 'null' || type === 'undefined' || type === 'boolean') {
    return 1;
  }

  if (type === 'number' || type === 'string') {
    return 2;
  }

  if (type === 'array') {
    const arr = value as unknown[];
    if (arr.length === 0) return 2;
    const avgItemComplexity =
      arr.reduce((sum: number, item) => sum + analyzeComplexity(item), 0) / arr.length;
    return 3 + avgItemComplexity;
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return 2;
    const avgValueComplexity =
      keys.reduce((sum: number, key) => sum + analyzeComplexity(obj[key]), 0) / keys.length;
    return 3 + avgValueComplexity;
  }

  return 1;
}

/**
 * Categorizes fixture difficulty based on input/output complexity
 */
function categorizeFixtureDifficulty(
  input: unknown,
  expectedOutput: unknown
): 'easy' | 'medium' | 'hard' {
  const inputComplexity = analyzeComplexity(input);
  const outputComplexity = analyzeComplexity(expectedOutput);
  const totalComplexity = inputComplexity + outputComplexity;

  if (totalComplexity <= 6) return 'easy';
  if (totalComplexity <= 12) return 'medium';
  return 'hard';
}

/**
 * Infers test type from input/output patterns
 */
function inferTestType(input: unknown, expectedOutput: unknown): string {
  const inputType = determineType(input);
  const outputType = determineType(expectedOutput);

  if (inputType === 'string' && outputType === 'string') {
    return 'string-transformation';
  }

  if (inputType === 'string' && outputType === 'object') {
    return 'parsing';
  }

  if (inputType === 'object' && outputType === 'string') {
    return 'serialization';
  }

  if (inputType === 'array' && outputType === 'array') {
    return 'array-transformation';
  }

  if (inputType === 'object' && outputType === 'object') {
    return 'object-transformation';
  }

  if (
    (inputType === 'string' || inputType === 'number') &&
    (outputType === 'boolean' || outputType === 'number')
  ) {
    return 'validation-or-computation';
  }

  return 'general';
}

/**
 * Generates tags for a fixture based on its characteristics
 */
function generateFixtureTags(input: unknown, expectedOutput: unknown): string[] {
  const tags: string[] = [];
  const inputType = determineType(input);
  const outputType = determineType(expectedOutput);

  tags.push(`input:${inputType}`);
  tags.push(`output:${outputType}`);

  // Add special case tags
  if (inputType === 'array' && Array.isArray(input)) {
    if (input.length === 0) tags.push('edge:empty-array');
    if (input.length > 100) tags.push('scale:large-array');
  }

  if (inputType === 'string' && typeof input === 'string') {
    if (input.length === 0) tags.push('edge:empty-string');
    if (input.length > 1000) tags.push('scale:long-string');
    if (/^\s+$/.test(input)) tags.push('edge:whitespace-only');
  }

  if (inputType === 'object' && input !== null && typeof input === 'object') {
    const keys = Object.keys(input as object);
    if (keys.length === 0) tags.push('edge:empty-object');
    if (keys.length > 20) tags.push('scale:large-object');
  }

  if (inputType === 'number' && typeof input === 'number') {
    if (input === 0) tags.push('edge:zero');
    if (input < 0) tags.push('edge:negative');
    if (!Number.isFinite(input)) tags.push('edge:non-finite');
  }

  if (input === null) tags.push('edge:null');

  return tags;
}

/**
 * Validates that a fixture is well-formed
 */
function validateFixture(
  input: unknown,
  expectedOutput: unknown,
  index: number
): { valid: boolean; reason?: string } {
  // Check for undefined (null is allowed)
  if (input === undefined) {
    return { valid: false, reason: `Input at index ${index} is undefined` };
  }

  if (expectedOutput === undefined) {
    return { valid: false, reason: `Expected output at index ${index} is undefined` };
  }

  return { valid: true };
}

/**
 * Calculates coverage score based on fixture diversity
 */
function calculateCoverageScore(fixtures: EvalFixture[]): number {
  if (fixtures.length === 0) return 0;

  // Count unique input types
  const inputTypes = new Set(fixtures.map((f) => determineType(f.input)));

  // Count unique output types
  const outputTypes = new Set(fixtures.map((f) => determineType(f.expectedOutput)));

  // Count unique difficulty levels
  const difficulties = new Set(fixtures.map((f) => f.metadata?.difficulty));

  // Count unique test types
  const testTypes = new Set(fixtures.map((f) => f.metadata?.testType));

  // Calculate diversity scores
  const inputDiversity = inputTypes.size / 7; // max 7 basic types
  const outputDiversity = outputTypes.size / 7;
  const difficultyDiversity = difficulties.size / 3; // easy, medium, hard
  const testTypeDiversity = Math.min(testTypes.size / 5, 1); // normalize to max 5

  // Weighted average
  const coverageScore =
    inputDiversity * 0.25 +
    outputDiversity * 0.25 +
    difficultyDiversity * 0.25 +
    testTypeDiversity * 0.25;

  return Math.round(coverageScore * 100) / 100;
}

/**
 * Generates recommendations for improving fixture quality
 */
function generateRecommendations(
  fixtures: EvalFixture[],
  statistics: EvalFixtureResult['statistics']
): string[] {
  const recommendations: string[] = [];

  if (!statistics) return recommendations;

  // Check fixture count
  if (fixtures.length < 5) {
    recommendations.push(
      `Consider adding more fixtures (current: ${fixtures.length}, recommended: 10+)`
    );
  }

  // Check coverage
  if (statistics.coverageScore < 0.5) {
    recommendations.push(
      `Test coverage is low (${Math.round(statistics.coverageScore * 100)}%). Add more diverse test cases.`
    );
  }

  // Check difficulty distribution
  const difficulties = fixtures.map((f) => f.metadata?.difficulty);
  const hasEasy = difficulties.includes('easy');
  const hasMedium = difficulties.includes('medium');
  const hasHard = difficulties.includes('hard');

  if (!hasEasy) recommendations.push('Add simple edge cases (easy difficulty)');
  if (!hasMedium) recommendations.push('Add moderate complexity cases (medium difficulty)');
  if (!hasHard) recommendations.push('Add complex scenarios (hard difficulty)');

  // Check for edge cases
  const tags = fixtures.flatMap((f) => f.metadata?.tags || []);
  const hasEdgeCases = tags.some((tag) => tag.startsWith('edge:'));

  if (!hasEdgeCases) {
    recommendations.push('Include edge cases (empty inputs, null values, boundary conditions)');
  }

  // Check for scale testing
  const hasScaleTests = tags.some((tag) => tag.startsWith('scale:'));
  if (!hasScaleTests) {
    recommendations.push('Add large-scale test cases to verify performance');
  }

  return recommendations;
}

/**
 * Eval Fixture Build Tool
 * Generates structured test fixtures for tool evaluation
 */
export const evalFixtureBuildTool = tool({
  description:
    'Builds structured evaluation fixtures for testing AI tools. Takes tool inputs and expected outputs, then generates comprehensive test fixtures with metadata, difficulty categorization, and coverage analysis.',
  inputSchema: jsonSchema<EvalFixtureBuildInput>({
    type: 'object',
    properties: {
      toolName: {
        type: 'string',
        description: 'Name of the tool being tested',
      },
      inputs: {
        type: 'array',
        description: 'Array of input test cases (can be any type)',
        items: {},
      },
      expectedOutputs: {
        type: 'array',
        description: 'Array of expected outputs corresponding to each input',
        items: {},
      },
    },
    required: ['toolName', 'inputs', 'expectedOutputs'],
    additionalProperties: false,
  }),
  async execute({ toolName, inputs, expectedOutputs }): Promise<EvalFixtureResult> {
    // Validate inputs
    if (!toolName || typeof toolName !== 'string' || toolName.trim().length === 0) {
      throw new Error('Invalid toolName: must be a non-empty string');
    }

    if (!Array.isArray(inputs)) {
      throw new Error('Invalid inputs: must be an array');
    }

    if (!Array.isArray(expectedOutputs)) {
      throw new Error('Invalid expectedOutputs: must be an array');
    }

    if (inputs.length !== expectedOutputs.length) {
      throw new Error(
        `Input/output mismatch: inputs has ${inputs.length} items but expectedOutputs has ${expectedOutputs.length} items`
      );
    }

    if (inputs.length === 0) {
      return {
        fixtures: [],
        count: 0,
        format: {
          inputTypes: [],
          outputTypes: [],
          complexity: 'simple',
        },
        statistics: {
          validFixtures: 0,
          invalidFixtures: 0,
          coverageScore: 0,
        },
        recommendations: ['Provide at least one input/output pair to build fixtures'],
      };
    }

    // Build fixtures
    const fixtures: EvalFixture[] = [];
    const validationErrors: string[] = [];
    const inputTypes = new Set<string>();
    const outputTypes = new Set<string>();
    let totalComplexity = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const expectedOutput = expectedOutputs[i];

      // Validate fixture
      const validation = validateFixture(input, expectedOutput, i);
      if (!validation.valid) {
        validationErrors.push(validation.reason!);
        continue;
      }

      // Collect type information
      const inputType = determineType(input);
      const outputType = determineType(expectedOutput);
      inputTypes.add(inputType);
      outputTypes.add(outputType);

      // Analyze complexity
      const complexity = analyzeComplexity(input) + analyzeComplexity(expectedOutput);
      totalComplexity += complexity;

      // Build fixture
      const fixture: EvalFixture = {
        id: `${toolName}-fixture-${i + 1}`,
        input,
        expectedOutput,
        metadata: {
          testType: inferTestType(input, expectedOutput),
          difficulty: categorizeFixtureDifficulty(input, expectedOutput),
          tags: generateFixtureTags(input, expectedOutput),
          description: `Test case ${i + 1} for ${toolName}`,
        },
      };

      fixtures.push(fixture);
    }

    // Determine overall complexity
    const avgComplexity = totalComplexity / Math.max(fixtures.length, 1);
    let overallComplexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (avgComplexity > 12) {
      overallComplexity = 'complex';
    } else if (avgComplexity > 6) {
      overallComplexity = 'moderate';
    }

    // Calculate statistics
    const statistics = {
      validFixtures: fixtures.length,
      invalidFixtures: validationErrors.length,
      coverageScore: calculateCoverageScore(fixtures),
    };

    // Generate recommendations
    const recommendations = generateRecommendations(fixtures, statistics);

    // Add validation errors to recommendations
    if (validationErrors.length > 0) {
      recommendations.unshift(
        `${validationErrors.length} fixture(s) failed validation: ${validationErrors.join('; ')}`
      );
    }

    return {
      fixtures,
      count: fixtures.length,
      format: {
        inputTypes: Array.from(inputTypes),
        outputTypes: Array.from(outputTypes),
        complexity: overallComplexity,
      },
      statistics,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  },
});

export default evalFixtureBuildTool;

/**
 * Test Case Generate Tool for TPMJS
 * Generates comprehensive test case outlines from function signatures,
 * including normal cases, edge cases, and testing recommendations.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Function parameter definition
 */
export interface FunctionParameter {
  name: string;
  type: string;
}

/**
 * Individual test case
 */
export interface TestCase {
  name: string;
  description: string;
  input: Record<string, unknown>;
  expectedBehavior: string;
  category: 'normal' | 'edge' | 'error';
}

/**
 * Output interface for test case generation
 */
export interface TestCaseGenerateResult {
  testCases: TestCase[];
  edgeCases: TestCase[];
  summary: {
    totalCases: number;
    normalCases: number;
    edgeCases: number;
    errorCases: number;
    coverageAreas: string[];
  };
  recommendations: string[];
}

type TestCaseGenerateInput = {
  functionName: string;
  params: FunctionParameter[];
  returnType: string;
};

/**
 * Generates test inputs based on parameter type
 */
function generateTestInputsForType(
  _paramName: string,
  paramType: string
): Array<{ value: unknown; category: 'normal' | 'edge' | 'error'; description: string }> {
  const type = paramType.toLowerCase();
  const inputs: Array<{
    value: unknown;
    category: 'normal' | 'edge' | 'error';
    description: string;
  }> = [];

  // String types
  if (type.includes('string')) {
    inputs.push(
      { value: 'test', category: 'normal', description: 'normal string' },
      { value: '', category: 'edge', description: 'empty string' },
      { value: ' ', category: 'edge', description: 'whitespace only' },
      { value: 'a'.repeat(1000), category: 'edge', description: 'very long string' },
      { value: '🚀 emoji 测试', category: 'edge', description: 'unicode characters' }
    );
  }

  // Number types
  else if (type.includes('number') || type === 'int' || type === 'float' || type === 'double') {
    inputs.push(
      { value: 42, category: 'normal', description: 'positive integer' },
      { value: 0, category: 'edge', description: 'zero' },
      { value: -1, category: 'edge', description: 'negative number' },
      { value: Number.MAX_SAFE_INTEGER, category: 'edge', description: 'maximum safe integer' },
      { value: 0.1 + 0.2, category: 'edge', description: 'floating point precision' },
      { value: Number.POSITIVE_INFINITY, category: 'edge', description: 'positive infinity' },
      { value: Number.NaN, category: 'error', description: 'NaN value' }
    );
  }

  // Boolean types
  else if (type.includes('boolean') || type === 'bool') {
    inputs.push(
      { value: true, category: 'normal', description: 'true value' },
      { value: false, category: 'normal', description: 'false value' }
    );
  }

  // Array types
  else if (type.includes('array') || type.includes('[]')) {
    inputs.push(
      { value: [1, 2, 3], category: 'normal', description: 'normal array' },
      { value: [], category: 'edge', description: 'empty array' },
      { value: [1], category: 'edge', description: 'single element' },
      { value: Array(1000).fill(0), category: 'edge', description: 'large array' }
    );
  }

  // Object types
  else if (type.includes('object') || type === 'any' || type === 'record') {
    inputs.push(
      { value: { key: 'value' }, category: 'normal', description: 'simple object' },
      { value: {}, category: 'edge', description: 'empty object' },
      {
        value: { nested: { deep: { value: 1 } } },
        category: 'edge',
        description: 'deeply nested object',
      }
    );
  }

  // Date types
  else if (type.includes('date')) {
    inputs.push(
      { value: '2025-01-15T10:00:00Z', category: 'normal', description: 'valid ISO date' },
      { value: '1970-01-01T00:00:00Z', category: 'edge', description: 'epoch date' },
      { value: 'invalid-date', category: 'error', description: 'invalid date string' }
    );
  }

  // Null/undefined cases for optional types
  if (
    type.includes('?') ||
    type.includes('optional') ||
    type.includes('null') ||
    type.includes('undefined')
  ) {
    inputs.push(
      { value: null, category: 'edge', description: 'null value' },
      { value: undefined, category: 'edge', description: 'undefined value' }
    );
  }

  // Default fallback
  if (inputs.length === 0) {
    inputs.push(
      { value: 'test-value', category: 'normal', description: 'sample value' },
      { value: null, category: 'edge', description: 'null value' }
    );
  }

  return inputs;
}

/**
 * Generates test cases for a function signature
 */
function generateTestCases(
  functionName: string,
  params: FunctionParameter[],
  returnType: string
): { testCases: TestCase[]; edgeCases: TestCase[]; coverageAreas: string[] } {
  const testCases: TestCase[] = [];
  const edgeCases: TestCase[] = [];
  const coverageAreas: string[] = [];

  // Generate normal cases
  const normalInputs: Record<string, unknown> = {};
  for (const param of params) {
    const inputs = generateTestInputsForType(param.name, param.type);
    const normalInput = inputs.find((i) => i.category === 'normal');
    if (normalInput) {
      normalInputs[param.name] = normalInput.value;
    }
  }

  testCases.push({
    name: 'should handle valid inputs',
    description: `Test ${functionName} with standard valid inputs`,
    input: normalInputs,
    expectedBehavior: `Should return ${returnType} successfully`,
    category: 'normal',
  });

  coverageAreas.push('Happy path with valid inputs');

  // Generate edge cases for each parameter
  for (const param of params) {
    const inputs = generateTestInputsForType(param.name, param.type);
    const paramEdgeCases = inputs.filter((i) => i.category === 'edge' || i.category === 'error');

    for (const edgeInput of paramEdgeCases) {
      const testInput = { ...normalInputs, [param.name]: edgeInput.value };
      const isError = edgeInput.category === 'error';

      const testCase: TestCase = {
        name: `should handle ${param.name} as ${edgeInput.description}`,
        description: `Test ${functionName} when ${param.name} is ${edgeInput.description}`,
        input: testInput,
        expectedBehavior: isError
          ? 'Should throw error or return error state'
          : `Should handle gracefully and return ${returnType}`,
        category: isError ? 'error' : 'edge',
      };

      if (isError) {
        testCases.push(testCase);
      } else {
        edgeCases.push(testCase);
      }
    }
  }

  // Add boundary condition tests
  if (params.some((p) => p.type.toLowerCase().includes('number'))) {
    coverageAreas.push('Boundary values (min/max)');
  }
  if (params.some((p) => p.type.toLowerCase().includes('string'))) {
    coverageAreas.push('String edge cases (empty, whitespace, unicode)');
  }
  if (params.some((p) => p.type.toLowerCase().includes('array'))) {
    coverageAreas.push('Array edge cases (empty, single element, large size)');
  }

  // Add concurrent/async tests if return type suggests async
  if (returnType.toLowerCase().includes('promise') || returnType.toLowerCase().includes('async')) {
    testCases.push({
      name: 'should handle concurrent calls',
      description: `Test ${functionName} with multiple concurrent invocations`,
      input: normalInputs,
      expectedBehavior: 'Should handle concurrent execution without race conditions',
      category: 'edge',
    });
    coverageAreas.push('Concurrency and async behavior');
  }

  // Add type validation tests
  if (params.length > 0) {
    testCases.push({
      name: 'should validate parameter types',
      description: `Test ${functionName} with invalid parameter types`,
      input: params.reduce(
        (acc, p) => {
          acc[p.name] = 'wrong-type';
          return acc;
        },
        {} as Record<string, unknown>
      ),
      expectedBehavior: 'Should throw TypeError or validate parameters',
      category: 'error',
    });
    coverageAreas.push('Type validation and error handling');
  }

  return { testCases, edgeCases, coverageAreas };
}

/**
 * Generates testing recommendations
 */
function generateRecommendations(
  _functionName: string,
  params: FunctionParameter[],
  returnType: string
): string[] {
  const recommendations: string[] = [];

  // Parameter-based recommendations
  if (params.length === 0) {
    recommendations.push('Consider testing the function with different execution contexts');
  } else if (params.length > 3) {
    recommendations.push(
      'Consider using test fixtures or factories to manage complex parameter combinations'
    );
  }

  // Type-based recommendations
  const hasAsync = returnType.toLowerCase().includes('promise');
  if (hasAsync) {
    recommendations.push('Use async/await in tests and verify promise resolution/rejection');
    recommendations.push('Test timeout scenarios for long-running operations');
  }

  const hasArray = params.some((p) => p.type.toLowerCase().includes('array'));
  if (hasArray) {
    recommendations.push('Verify immutability - ensure function does not mutate input arrays');
  }

  const hasObject = params.some((p) => p.type.toLowerCase().includes('object'));
  if (hasObject) {
    recommendations.push('Test with frozen objects to ensure no unintended mutations');
  }

  const hasNumber = params.some((p) => p.type.toLowerCase().includes('number'));
  if (hasNumber) {
    recommendations.push('Test floating-point precision edge cases (e.g., 0.1 + 0.2)');
  }

  // General recommendations
  recommendations.push('Use property-based testing for comprehensive coverage');
  recommendations.push('Mock external dependencies and verify interactions');
  recommendations.push('Add performance benchmarks for critical code paths');
  recommendations.push('Ensure 100% branch coverage with edge case tests');

  return recommendations.slice(0, 8);
}

/**
 * Test Case Generate Tool
 * Generates test case outlines from function signatures
 */
export const testCaseGenerateTool = tool({
  description:
    'Generates comprehensive test case outlines from a function signature. Analyzes parameter types and return type to create normal test cases, edge cases, and error cases. Provides testing recommendations and identifies coverage areas. Useful for quickly scaffolding test suites and ensuring thorough test coverage.',
  inputSchema: jsonSchema<TestCaseGenerateInput>({
    type: 'object',
    properties: {
      functionName: {
        type: 'string',
        description: 'Name of the function to generate tests for',
      },
      params: {
        type: 'array',
        description: 'Array of function parameters with name and type',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Parameter name',
            },
            type: {
              type: 'string',
              description: 'Parameter type (e.g., string, number, Array<string>, optional string)',
            },
          },
          required: ['name', 'type'],
        },
      },
      returnType: {
        type: 'string',
        description: 'Return type of the function (e.g., boolean, Promise<User>, void)',
      },
    },
    required: ['functionName', 'params', 'returnType'],
    additionalProperties: false,
  }),
  async execute({ functionName, params, returnType }): Promise<TestCaseGenerateResult> {
    // Validate input
    if (!functionName || typeof functionName !== 'string') {
      throw new Error('functionName must be a non-empty string');
    }

    if (!Array.isArray(params)) {
      throw new Error('params must be an array');
    }

    if (!returnType || typeof returnType !== 'string') {
      throw new Error('returnType must be a non-empty string');
    }

    // Generate test cases
    const { testCases, edgeCases, coverageAreas } = generateTestCases(
      functionName,
      params,
      returnType
    );

    // Generate recommendations
    const recommendations = generateRecommendations(functionName, params, returnType);

    // Calculate summary
    const allCases = [...testCases, ...edgeCases];
    const normalCases = allCases.filter((c) => c.category === 'normal').length;
    const edgeCaseCount = allCases.filter((c) => c.category === 'edge').length;
    const errorCases = allCases.filter((c) => c.category === 'error').length;

    return {
      testCases,
      edgeCases,
      summary: {
        totalCases: allCases.length,
        normalCases,
        edgeCases: edgeCaseCount,
        errorCases,
        coverageAreas,
      },
      recommendations,
    };
  },
});

export default testCaseGenerateTool;

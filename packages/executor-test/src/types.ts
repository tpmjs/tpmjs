export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export interface TestSuite {
  name: string;
  level: 'core' | 'standard' | 'extended';
  results: TestResult[];
}

export interface ComplianceResult {
  target: string;
  protocolVersion: string;
  timestamp: string;
  suites: TestSuite[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    coreCompliant: boolean;
    standardCompliant: boolean;
  };
}

export interface HealthResponse {
  status: string;
  protocolVersion: string;
  implementationVersion: string;
  runtime?: string;
  timestamp?: string;
}

export interface ExecuteToolResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  errorStage?: 'request' | 'load' | 'execute' | 'executor';
  errorCode?: string;
  retryable?: boolean;
  executionTimeMs: number;
}

export interface InfoResponse {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    isolation: 'none' | 'process' | 'container' | 'vm';
    executionModes: string[];
    maxExecutionTimeMs: number;
    maxRequestBodyBytes: number;
    supportsStreaming?: boolean;
    supportsCallbacks?: boolean;
    supportsCaching?: boolean;
  };
  runtime?: {
    platform?: string;
    nodeVersion?: string;
    region?: string;
  };
}

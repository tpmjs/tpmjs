/**
 * Shared TypeScript types for the TPMJS tool generator
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: ParameterDefinition[];
  returns?: ReturnDefinition;
  env?: string[];
  frameworks?: string[];
  aiAgent?: {
    systemPrompt?: string;
    model?: string;
  };
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ReturnDefinition {
  type: string;
  description: string;
}

export interface PackageInfo {
  name: string;
  description: string;
  author: string;
  license: string;
  category: string;
}

export interface GeneratorConfig {
  packageInfo: PackageInfo;
  tools: ToolDefinition[];
  outputPath: string;
  mode: 'simple' | 'advanced';
}

export interface CLIOptions {
  name?: string;
  description?: string;
  category?: string;
  tool?: string[];
  output?: string;
  yes?: boolean;
}

export interface GenerationResult {
  success: boolean;
  outputPath: string;
  filesCreated: string[];
  error?: string;
}

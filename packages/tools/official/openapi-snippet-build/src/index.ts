/**
 * OpenAPI Snippet Build Tool for TPMJS
 * Builds minimal OpenAPI 3.0 YAML snippets from endpoint metadata.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Endpoint parameter definition
 */
export interface EndpointParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required?: boolean;
  type?: string;
  description?: string;
  example?: string | number | boolean;
}

/**
 * Response schema definition
 */
export interface ResponseSchema {
  type: string;
  properties?: Record<string, { type: string; description?: string }>;
  example?: unknown;
}

/**
 * Endpoint definition for OpenAPI generation
 */
export interface EndpointDefinition {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  params?: EndpointParameter[];
  requestBody?: ResponseSchema;
  response?: ResponseSchema;
}

/**
 * Output interface for OpenAPI snippet
 */
export interface OpenapiSnippetResult {
  openapi: string;
}

type OpenapiSnippetInput = {
  endpoints: EndpointDefinition[];
};

/**
 * Generates a schema object in YAML format
 * Domain rule: schema_generation - Generates request/response schemas with types and examples
 */
function generateSchemaYaml(schema: ResponseSchema | undefined, indent = '            '): string {
  if (!schema) {
    return `${indent}type: object\n`;
  }

  let yaml = `${indent}type: ${schema.type}\n`;

  // Domain rule: schema_generation - Property definitions with types and descriptions
  if (schema.properties) {
    yaml += `${indent}properties:\n`;
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      yaml += `${indent}  ${propName}:\n`;
      yaml += `${indent}    type: ${propDef.type}\n`;
      if (propDef.description) {
        yaml += `${indent}    description: ${propDef.description}\n`;
      }
    }
  }

  // Domain rule: schema_generation - Example values for documentation
  if (schema.example) {
    yaml += `${indent}example:\n`;
    const exampleStr = JSON.stringify(schema.example, null, 2);
    const exampleLines = exampleStr.split('\n');
    for (const line of exampleLines) {
      yaml += `${indent}  ${line}\n`;
    }
  }

  return yaml;
}

/**
 * Generates parameters section in YAML format
 */
function generateParametersYaml(params: EndpointParameter[] = []): string {
  if (params.length === 0) return '';

  let yaml = '      parameters:\n';
  for (const param of params) {
    yaml += `        - name: ${param.name}\n`;
    yaml += `          in: ${param.in}\n`;
    yaml += `          required: ${param.required !== false}\n`;
    yaml += `          schema:\n`;
    yaml += `            type: ${param.type || 'string'}\n`;
    if (param.description) {
      yaml += `          description: ${param.description}\n`;
    }
    if (param.example !== undefined) {
      yaml += `          example: ${JSON.stringify(param.example)}\n`;
    }
  }
  return yaml;
}

/**
 * Generates OpenAPI 3.0 YAML from endpoint definitions
 * Domain rule: openapi_format - Generates valid OpenAPI 3.0 YAML format
 * Domain rule: minimal - Focuses on essential elements only
 */
function generateOpenAPIYaml(endpoints: EndpointDefinition[]): string {
  // Domain rule: openapi_format - Standard OpenAPI 3.0 header
  let yaml = 'openapi: 3.0.0\n';
  yaml += 'info:\n';
  yaml += '  title: API Documentation\n';
  yaml += '  version: 1.0.0\n';
  yaml += 'paths:\n';

  // Group endpoints by path
  const pathGroups = new Map<string, EndpointDefinition[]>();
  for (const endpoint of endpoints) {
    if (!pathGroups.has(endpoint.path)) {
      pathGroups.set(endpoint.path, []);
    }
    pathGroups.get(endpoint.path)!.push(endpoint);
  }

  // Domain rule: openapi_format - Generate path and method entries
  // Domain rule: minimal - Include only specified endpoints
  for (const [path, pathEndpoints] of pathGroups.entries()) {
    yaml += `  ${path}:\n`;

    for (const endpoint of pathEndpoints) {
      const method = endpoint.method.toLowerCase();
      yaml += `    ${method}:\n`;

      if (endpoint.summary) {
        yaml += `      summary: ${endpoint.summary}\n`;
      }
      if (endpoint.description) {
        yaml += `      description: ${endpoint.description}\n`;
      }

      // Domain rule: schema_generation - Parameters (path, query, header)
      if (endpoint.params && endpoint.params.length > 0) {
        yaml += generateParametersYaml(endpoint.params);
      }

      // Domain rule: schema_generation - Request body schema
      if (endpoint.requestBody) {
        yaml += '      requestBody:\n';
        yaml += '        required: true\n';
        yaml += '        content:\n';
        yaml += '          application/json:\n';
        yaml += '            schema:\n';
        yaml += generateSchemaYaml(endpoint.requestBody, '              ');
      }

      // Domain rule: schema_generation - Response schema
      yaml += '      responses:\n';
      yaml += "        '200':\n";
      yaml += '          description: Successful response\n';
      if (endpoint.response) {
        yaml += '          content:\n';
        yaml += '            application/json:\n';
        yaml += '              schema:\n';
        yaml += generateSchemaYaml(endpoint.response, '                ');
      }
    }
  }

  return yaml;
}

/**
 * OpenAPI Snippet Build Tool
 * Builds minimal OpenAPI 3.0 YAML snippets from endpoint metadata
 */
export const openapiSnippetBuildTool = tool({
  description:
    'Builds minimal OpenAPI 3.0 YAML snippet from endpoint metadata. Takes endpoint definitions with method, path, params, and response schemas. Returns valid OpenAPI 3.0 YAML with request/response schemas.',
  inputSchema: jsonSchema<OpenapiSnippetInput>({
    type: 'object',
    properties: {
      endpoints: {
        type: 'array',
        description: 'Endpoint definitions [{method, path, params, response}]',
        items: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              description: 'HTTP method (GET, POST, PUT, DELETE, etc.)',
            },
            path: {
              type: 'string',
              description: 'API endpoint path (e.g., /users/{id})',
            },
            summary: {
              type: 'string',
              description: 'Brief summary of the endpoint',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the endpoint',
            },
            params: {
              type: 'array',
              description: 'Array of parameters',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Parameter name',
                  },
                  in: {
                    type: 'string',
                    enum: ['path', 'query', 'header'],
                    description: 'Parameter location',
                  },
                  required: {
                    type: 'boolean',
                    description: 'Whether parameter is required',
                  },
                  type: {
                    type: 'string',
                    description: 'Parameter type',
                  },
                  description: {
                    type: 'string',
                    description: 'Parameter description',
                  },
                  example: {
                    description: 'Example value',
                  },
                },
                required: ['name', 'in'],
              },
            },
            requestBody: {
              type: 'object',
              description: 'Request body schema',
            },
            response: {
              type: 'object',
              description: 'Response schema',
            },
          },
          required: ['method', 'path'],
        },
      },
    },
    required: ['endpoints'],
    additionalProperties: false,
  }),
  async execute({ endpoints }): Promise<OpenapiSnippetResult> {
    // Validate input
    if (!endpoints || !Array.isArray(endpoints)) {
      throw new Error('endpoints is required and must be an array');
    }

    if (endpoints.length === 0) {
      throw new Error('endpoints array cannot be empty');
    }

    // Validate each endpoint
    for (const endpoint of endpoints) {
      if (!endpoint.method || typeof endpoint.method !== 'string') {
        throw new Error('Each endpoint must have a method string');
      }
      if (!endpoint.path || typeof endpoint.path !== 'string') {
        throw new Error('Each endpoint must have a path string');
      }
    }

    // Generate OpenAPI YAML
    const openapi = generateOpenAPIYaml(endpoints);

    return {
      openapi,
    };
  },
});

export default openapiSnippetBuildTool;

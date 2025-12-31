/**
 * OpenAPI Snippet Build Tool for TPMJS
 * Generates code snippets from OpenAPI operation definitions.
 * Supports multiple languages including JavaScript, Python, cURL, and Go.
 */

import { jsonSchema, tool } from 'ai';

/**
 * OpenAPI parameter
 */
export interface OperationParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required?: boolean;
  type?: string;
  example?: unknown;
}

/**
 * OpenAPI operation definition
 */
export interface Operation {
  method: string;
  path: string;
  parameters?: OperationParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { example?: unknown }>;
  };
}

/**
 * Output interface for snippet generation
 */
export interface OpenapiSnippetResult {
  snippet: string;
  language: string;
  imports: string[];
}

type OpenapiSnippetInput = {
  operation: Operation;
  language: string;
};

/**
 * Builds URL from path and parameters
 */
function buildUrl(path: string, parameters: OperationParameter[] = []): string {
  let url = path;
  const queryParams: string[] = [];

  // Replace path parameters
  for (const param of parameters) {
    if (param.in === 'path') {
      const value = param.example ?? `{${param.name}}`;
      url = url.replace(`{${param.name}}`, String(value));
    }
  }

  // Add query parameters
  for (const param of parameters) {
    if (param.in === 'query') {
      const value = param.example ?? `{${param.name}}`;
      queryParams.push(`${param.name}=${value}`);
    }
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }

  return url;
}

/**
 * Extracts request body example
 */
function getRequestBody(operation: Operation): string | null {
  if (!operation.requestBody?.content) return null;

  const jsonContent = operation.requestBody.content['application/json'];
  if (jsonContent?.example) {
    return JSON.stringify(jsonContent.example, null, 2);
  }

  return null;
}

/**
 * Gets headers from parameters
 */
function getHeaders(parameters: OperationParameter[] = []): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const param of parameters) {
    if (param.in === 'header') {
      headers[param.name] = String(param.example ?? `{${param.name}}`);
    }
  }

  return headers;
}

/**
 * Generates JavaScript/TypeScript snippet using fetch
 */
function generateJavaScript(operation: Operation, baseUrl = 'https://api.example.com'): string {
  const url = buildUrl(operation.path, operation.parameters);
  const headers = getHeaders(operation.parameters);
  const body = getRequestBody(operation);
  const method = operation.method.toUpperCase();

  let snippet = `const response = await fetch('${baseUrl}${url}', {\n`;
  snippet += `  method: '${method}'`;

  if (Object.keys(headers).length > 0) {
    snippet += `,\n  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`;
  }

  if (body) {
    snippet += `,\n  body: JSON.stringify(${body.replace(/\n/g, '\n  ')})`;
  }

  snippet += '\n});\n\nconst data = await response.json();';

  return snippet;
}

/**
 * Generates Python snippet using requests
 */
function generatePython(operation: Operation, baseUrl = 'https://api.example.com'): string {
  const url = buildUrl(operation.path, operation.parameters);
  const headers = getHeaders(operation.parameters);
  const body = getRequestBody(operation);
  const method = operation.method.toLowerCase();

  let snippet = `response = requests.${method}(\n`;
  snippet += `    '${baseUrl}${url}'`;

  if (Object.keys(headers).length > 0) {
    snippet += `,\n    headers=${JSON.stringify(headers)}`;
  }

  if (body) {
    snippet += `,\n    json=${body.replace(/\n/g, '\n    ')}`;
  }

  snippet += '\n)\n\ndata = response.json()';

  return snippet;
}

/**
 * Generates cURL snippet
 */
function generateCurl(operation: Operation, baseUrl = 'https://api.example.com'): string {
  const url = buildUrl(operation.path, operation.parameters);
  const headers = getHeaders(operation.parameters);
  const body = getRequestBody(operation);
  const method = operation.method.toUpperCase();

  let snippet = `curl -X ${method} '${baseUrl}${url}'`;

  for (const [key, value] of Object.entries(headers)) {
    snippet += ` \\\n  -H '${key}: ${value}'`;
  }

  if (body) {
    snippet += ` \\\n  -H 'Content-Type: application/json'`;
    snippet += ` \\\n  -d '${body.replace(/\n/g, ' ')}'`;
  }

  return snippet;
}

/**
 * Generates Go snippet using net/http
 */
function generateGo(operation: Operation, baseUrl = 'https://api.example.com'): string {
  const url = buildUrl(operation.path, operation.parameters);
  const headers = getHeaders(operation.parameters);
  const body = getRequestBody(operation);
  const method = operation.method.toUpperCase();

  let snippet = '';

  if (body) {
    snippet += `payload := []byte(\`${body}\`)\n`;
    snippet += `req, err := http.NewRequest("${method}", "${baseUrl}${url}", bytes.NewBuffer(payload))\n`;
  } else {
    snippet += `req, err := http.NewRequest("${method}", "${baseUrl}${url}", nil)\n`;
  }

  snippet += 'if err != nil {\n    panic(err)\n}\n\n';

  for (const [key, value] of Object.entries(headers)) {
    snippet += `req.Header.Set("${key}", "${value}")\n`;
  }

  if (body) {
    snippet += `req.Header.Set("Content-Type", "application/json")\n`;
  }

  snippet += '\nclient := &http.Client{}\nresp, err := client.Do(req)';

  return snippet;
}

/**
 * Gets imports for the language
 */
function getImports(language: string): string[] {
  const imports: Record<string, string[]> = {
    javascript: [],
    typescript: [],
    python: ['import requests'],
    curl: [],
    go: ['import "net/http"', 'import "bytes"'],
  };

  return imports[language.toLowerCase()] || [];
}

/**
 * OpenAPI Snippet Build Tool
 * Generates code snippets from OpenAPI operations
 */
export const openapiSnippetBuildTool = tool({
  description:
    'Generates code snippets from OpenAPI operation definitions. Takes an operation object with method, path, and parameters, plus a target language. Returns a ready-to-use code snippet with necessary imports. Supports JavaScript, Python, cURL, and Go.',
  inputSchema: jsonSchema<OpenapiSnippetInput>({
    type: 'object',
    properties: {
      operation: {
        type: 'object',
        description: 'OpenAPI operation definition',
        properties: {
          method: {
            type: 'string',
            description: 'HTTP method (GET, POST, PUT, DELETE, etc.)',
          },
          path: {
            type: 'string',
            description: 'API endpoint path (e.g., /users/{id})',
          },
          parameters: {
            type: 'array',
            description: 'Array of operation parameters',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Parameter name',
                },
                in: {
                  type: 'string',
                  enum: ['path', 'query', 'header', 'body'],
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
                example: {
                  description: 'Example value for the parameter',
                },
              },
              required: ['name', 'in'],
            },
          },
          requestBody: {
            type: 'object',
            description: 'Request body schema',
          },
        },
        required: ['method', 'path'],
      },
      language: {
        type: 'string',
        description: 'Target language (javascript, python, curl, go)',
        enum: ['javascript', 'typescript', 'python', 'curl', 'go'],
      },
    },
    required: ['operation', 'language'],
    additionalProperties: false,
  }),
  async execute({ operation, language }): Promise<OpenapiSnippetResult> {
    // Validate operation
    if (!operation || typeof operation !== 'object') {
      throw new Error('operation is required and must be an object');
    }

    if (!operation.method || typeof operation.method !== 'string') {
      throw new Error('operation.method is required and must be a string');
    }

    if (!operation.path || typeof operation.path !== 'string') {
      throw new Error('operation.path is required and must be a string');
    }

    // Validate language
    const supportedLanguages = ['javascript', 'typescript', 'python', 'curl', 'go'];
    const normalizedLanguage = language.toLowerCase();

    if (!supportedLanguages.includes(normalizedLanguage)) {
      throw new Error(
        `Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}`
      );
    }

    // Generate snippet based on language
    let snippet: string;

    switch (normalizedLanguage) {
      case 'javascript':
      case 'typescript':
        snippet = generateJavaScript(operation);
        break;
      case 'python':
        snippet = generatePython(operation);
        break;
      case 'curl':
        snippet = generateCurl(operation);
        break;
      case 'go':
        snippet = generateGo(operation);
        break;
      default:
        throw new Error(`Language ${language} not implemented`);
    }

    const imports = getImports(normalizedLanguage);

    return {
      snippet,
      language: normalizedLanguage,
      imports,
    };
  },
});

export default openapiSnippetBuildTool;

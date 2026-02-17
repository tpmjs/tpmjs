/**
 * @tpmjs/official-agnt-http-request — HTTP Request Tools for AI Agents
 *
 * Make HTTP requests to any API endpoint with configurable method, headers,
 * authentication, and body.
 *
 * No environment variables required. Authentication is configured per-request.
 */

import { jsonSchema, tool } from 'ai';

// ─── Output Types ────────────────────────────────────────────────────────────

export interface HttpRequestResult {
  success: boolean;
  status: number;
  statusText: string;
  data: unknown;
  headers: Record<string, string>;
}

// ─── HTTP Request Tool ──────────────────────────────────────────────────────

const VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const VALID_AUTH_TYPES = ['none', 'basic', 'bearer'];

export interface HttpRequestInput {
  url: string;
  method: string;
  headers?: string;
  body?: string;
  authType?: string;
  authToken?: string;
  username?: string;
  password?: string;
  query?: string;
}

export const httpRequest = tool({
  description:
    'Make an HTTP request to any API endpoint. Supports GET, POST, PUT, DELETE, PATCH methods with optional headers, body, and authentication (none, basic, bearer).',
  inputSchema: jsonSchema<HttpRequestInput>({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The full URL of the API endpoint to call.',
      },
      method: {
        type: 'string',
        description: 'HTTP method: GET, POST, PUT, DELETE, or PATCH.',
      },
      headers: {
        type: 'string',
        description:
          'Additional HTTP headers as a JSON string (e.g. \'{"Content-Type": "application/json"}\').',
      },
      body: {
        type: 'string',
        description: 'Request body as a JSON string. Ignored for GET requests.',
      },
      authType: {
        type: 'string',
        description:
          'Authentication type: "none" (default), "basic" (username/password), or "bearer" (token).',
      },
      authToken: {
        type: 'string',
        description: 'Bearer token for authentication. Required when authType is "bearer".',
      },
      username: {
        type: 'string',
        description: 'Username for Basic authentication. Required when authType is "basic".',
      },
      password: {
        type: 'string',
        description: 'Password for Basic authentication. Required when authType is "basic".',
      },
      query: {
        type: 'string',
        description:
          'Query parameters as a URL-encoded string (e.g. "key=value&other=123"). Appended to the URL.',
      },
    },
    required: ['url', 'method'],
    additionalProperties: false,
  }),
  async execute(input: HttpRequestInput): Promise<HttpRequestResult> {
    try {
      if (!input.url || input.url.trim().length === 0) {
        throw new Error('url is required and must be non-empty');
      }

      const method = input.method.toUpperCase();
      if (!VALID_METHODS.includes(method)) {
        throw new Error(`method must be one of: ${VALID_METHODS.join(', ')}`);
      }

      const authType = input.authType ?? 'none';
      if (!VALID_AUTH_TYPES.includes(authType)) {
        throw new Error(`authType must be one of: ${VALID_AUTH_TYPES.join(', ')}`);
      }

      if (authType === 'bearer' && !input.authToken) {
        throw new Error('authToken is required when authType is "bearer"');
      }

      if (authType === 'basic' && (!input.username || !input.password)) {
        throw new Error('username and password are required when authType is "basic"');
      }

      // Build URL with query parameters
      let url = input.url;
      if (input.query) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${input.query}`;
      }

      // Build headers
      const headers: Record<string, string> = {};

      if (input.headers) {
        try {
          const parsedHeaders = JSON.parse(input.headers) as Record<string, string>;
          Object.assign(headers, parsedHeaders);
        } catch {
          throw new Error(
            'headers must be a valid JSON string (e.g. \'{"Content-Type": "application/json"}\')'
          );
        }
      }

      // Apply authentication
      if (authType === 'bearer') {
        headers.Authorization = `Bearer ${input.authToken}`;
      } else if (authType === 'basic') {
        const credentials = btoa(`${input.username}:${input.password}`);
        headers.Authorization = `Basic ${credentials}`;
      }

      // Build request options
      const options: RequestInit = { method, headers };

      if (input.body && method !== 'GET') {
        options.body = input.body;
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(url, options);

      // Parse response body
      const responseText = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      };
    } catch (error) {
      throw new Error(`Failed to execute HTTP request: ${(error as Error).message}`);
    }
  },
});

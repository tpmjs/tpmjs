/**
 * Type-safe API client for integration tests
 *
 * Provides convenient methods for making API requests
 * with proper error handling and response parsing.
 */

import { collectSSEEvents, type SSEEvent } from './sse-parser';

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  headers: Headers;
}

export interface ApiErrorResponse {
  ok: false;
  status: number;
  error: string;
  headers: Headers;
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * Create an API client with a base URL and optional custom fetch
 */
export function createApiClient(baseUrl: string, customFetch: typeof fetch = fetch) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  async function request<T = unknown>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      query?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<ApiResult<T>> {
    const { body, headers = {}, query } = options;

    let url = `${normalizedBaseUrl}${path}`;

    // Add query parameters
    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await customFetch(url, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Use default error message
      }

      return {
        ok: false,
        status: response.status,
        error: errorMessage,
        headers: response.headers,
      };
    }

    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      ok: true,
      status: response.status,
      data,
      headers: response.headers,
    };
  }

  return {
    /**
     * Make a GET request
     */
    get<T = unknown>(
      path: string,
      options?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | undefined>;
      }
    ): Promise<ApiResult<T>> {
      return request<T>('GET', path, options);
    },

    /**
     * Make a POST request
     */
    post<T = unknown>(
      path: string,
      body?: unknown,
      options?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | undefined>;
      }
    ): Promise<ApiResult<T>> {
      return request<T>('POST', path, { ...options, body });
    },

    /**
     * Make a PATCH request
     */
    patch<T = unknown>(
      path: string,
      body?: unknown,
      options?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | undefined>;
      }
    ): Promise<ApiResult<T>> {
      return request<T>('PATCH', path, { ...options, body });
    },

    /**
     * Make a PUT request
     */
    put<T = unknown>(
      path: string,
      body?: unknown,
      options?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | undefined>;
      }
    ): Promise<ApiResult<T>> {
      return request<T>('PUT', path, { ...options, body });
    },

    /**
     * Make a DELETE request
     */
    delete<T = unknown>(
      path: string,
      options?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | undefined>;
      }
    ): Promise<ApiResult<T>> {
      return request<T>('DELETE', path, options);
    },

    /**
     * Make a request to an SSE endpoint and collect events
     */
    async sse(
      path: string,
      body?: unknown,
      options?: {
        headers?: Record<string, string>;
        timeout?: number;
        maxEvents?: number;
      }
    ): Promise<{ ok: boolean; status: number; events: SSEEvent[] }> {
      const { headers = {}, timeout, maxEvents } = options || {};

      const url = `${normalizedBaseUrl}${path}`;
      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      if (body !== undefined) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const response = await customFetch(url, {
        method: body !== undefined ? 'POST' : 'GET',
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          events: [],
        };
      }

      const events = await collectSSEEvents(response, { timeout, maxEvents });

      return {
        ok: true,
        status: response.status,
        events,
      };
    },

    /**
     * Make a raw request and return the Response object
     */
    async raw(
      method: string,
      path: string,
      options?: {
        body?: unknown;
        headers?: Record<string, string>;
      }
    ): Promise<Response> {
      const { body, headers = {} } = options || {};

      const url = `${normalizedBaseUrl}${path}`;
      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      if (body !== undefined) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      return customFetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

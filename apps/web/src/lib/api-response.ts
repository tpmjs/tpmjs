import { NextResponse } from 'next/server';

/**
 * Standardized API Response Format
 *
 * All API endpoints should use this helper for consistent response formatting.
 *
 * Success response:
 * {
 *   success: true,
 *   data: T,
 *   meta: { version, timestamp, requestId },
 *   pagination?: { ... }
 * }
 *
 * Error response:
 * {
 *   success: false,
 *   error: { code, message, details? },
 *   meta: { version, timestamp, requestId }
 * }
 */

const API_VERSION = '1.0.0';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  version: string;
  timestamp: string;
  requestId: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: ApiMeta;
  pagination?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  meta: ApiMeta;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Common error codes for API responses
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Create API metadata with version and timestamp
 */
function createMeta(requestId?: string): ApiMeta {
  return {
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    requestId: requestId ?? crypto.randomUUID(),
  };
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    requestId?: string;
    pagination?: Record<string, unknown>;
    status?: number;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: createMeta(options?.requestId),
  };

  if (options?.pagination) {
    response.pagination = options.pagination;
  }

  return NextResponse.json(response, { status: options?.status ?? 200 });
}

/**
 * Create an error API response
 */
export function apiError(
  code: ErrorCode | string,
  message: string,
  options?: {
    requestId?: string;
    details?: Record<string, unknown>;
    status?: number;
    headers?: Record<string, string>;
  }
): NextResponse<ApiErrorResponse> {
  const error: ApiError = {
    code,
    message,
  };

  if (options?.details) {
    error.details = options.details;
  }

  const response: ApiErrorResponse = {
    success: false,
    error,
    meta: createMeta(options?.requestId),
  };

  return NextResponse.json(response, {
    status: options?.status ?? 500,
    headers: options?.headers,
  });
}

// Common error response helpers

export function apiUnauthorized(
  message = 'Authentication required',
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return apiError(ErrorCodes.UNAUTHORIZED, message, { status: 401, requestId });
}

export function apiForbidden(
  message = 'Access denied',
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return apiError(ErrorCodes.FORBIDDEN, message, { status: 403, requestId });
}

export function apiNotFound(resource: string, requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError(ErrorCodes.NOT_FOUND, `${resource} not found`, { status: 404, requestId });
}

export function apiValidationError(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return apiError(ErrorCodes.VALIDATION_ERROR, message, { status: 400, details, requestId });
}

export function apiConflict(message: string, requestId?: string): NextResponse<ApiErrorResponse> {
  return apiError(ErrorCodes.CONFLICT, message, { status: 409, requestId });
}

export function apiRateLimited(
  retryAfterSeconds: number,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return apiError(
    ErrorCodes.RATE_LIMITED,
    `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
    {
      status: 429,
      requestId,
      details: { retryAfter: retryAfterSeconds },
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
      },
    }
  );
}

export function apiInternalError(
  message = 'Internal server error',
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return apiError(ErrorCodes.INTERNAL_ERROR, message, { status: 500, requestId });
}

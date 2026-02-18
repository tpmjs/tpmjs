/**
 * Structured error categorization for ML training data.
 * Infers a standardized error category from error messages, codes, and status codes.
 */

export type ErrorCategory =
  | 'schema_validation'
  | 'auth_failure'
  | 'rate_limit'
  | 'timeout'
  | 'invalid_input'
  | 'tool_bug'
  | 'network_error'
  | 'provider_error'
  | 'not_found'
  | 'quota_exceeded'
  | 'unknown';

/**
 * Infer a structured error category from error details.
 * Uses error codes, HTTP status codes, and message pattern matching.
 */
export function inferErrorCategory(params: {
  errorCode?: string;
  errorMessage?: string;
  statusCode?: number;
}): ErrorCategory {
  const { errorCode, errorMessage, statusCode } = params;
  const code = errorCode?.toLowerCase() ?? '';
  const msg = errorMessage?.toLowerCase() ?? '';

  // HTTP status code based classification
  if (statusCode) {
    if (statusCode === 401 || statusCode === 403) return 'auth_failure';
    if (statusCode === 404) return 'not_found';
    if (statusCode === 429) return 'rate_limit';
    if (statusCode === 408 || statusCode === 504) return 'timeout';
    if (statusCode === 422) return 'invalid_input';
  }

  // Error code based classification
  if (code === 'timeout' || code === 'execution_timeout') return 'timeout';
  if (code === 'executor_unreachable') return 'network_error';

  // Message pattern matching
  if (msg.includes('schema') || msg.includes('invalid schema') || msg.includes('missing items'))
    return 'schema_validation';

  if (
    msg.includes('unauthorized') ||
    msg.includes('authentication') ||
    msg.includes('api key') ||
    msg.includes('invalid key') ||
    msg.includes('forbidden')
  )
    return 'auth_failure';

  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('throttl'))
    return 'rate_limit';

  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('deadline exceeded'))
    return 'timeout';

  if (
    msg.includes('invalid input') ||
    msg.includes('validation') ||
    msg.includes('invalid parameter') ||
    msg.includes('required field') ||
    msg.includes('missing required')
  )
    return 'invalid_input';

  if (
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('does not exist') ||
    msg.includes('no such')
  )
    return 'not_found';

  if (
    msg.includes('quota') ||
    msg.includes('billing') ||
    msg.includes('insufficient') ||
    msg.includes('exceeded')
  )
    return 'quota_exceeded';

  if (
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('dns') ||
    msg.includes('socket') ||
    msg.includes('connection') ||
    msg.includes('unreachable') ||
    msg.includes('fetch failed')
  )
    return 'network_error';

  if (
    msg.includes('provider') ||
    msg.includes('openai') ||
    msg.includes('anthropic') ||
    msg.includes('model') ||
    msg.includes('api error')
  )
    return 'provider_error';

  // If there's an error but no clear category, check if it looks like a tool bug
  if (
    msg.includes('typeerror') ||
    msg.includes('referenceerror') ||
    msg.includes('syntaxerror') ||
    msg.includes('cannot read') ||
    msg.includes('undefined') ||
    msg.includes('is not a function') ||
    msg.includes('unexpected token')
  )
    return 'tool_bug';

  return 'unknown';
}

/**
 * Truncate a JSON-serializable value to a max byte size.
 * Used to keep inputArgs and outputSummary within storage limits.
 */
export function truncateJson(value: unknown, maxBytes = 2048): unknown {
  if (value === null || value === undefined) return null;
  try {
    const str = JSON.stringify(value);
    if (str.length <= maxBytes) return value;
    // Truncate the string and return as a wrapped object
    return { _truncated: true, preview: str.slice(0, maxBytes - 50), originalSize: str.length };
  } catch {
    return { _truncated: true, error: 'non_serializable' };
  }
}

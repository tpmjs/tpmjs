import type { ExecutorFailure } from '@tpmjs/types/executor';

export type ExecutorHealthVerdict =
  | { status: 'HEALTHY'; error: null }
  | { status: 'BROKEN' | 'UNKNOWN'; error: string };

/**
 * Convert a typed executor observation into a tool-health verdict.
 *
 * This function intentionally never inspects the human-readable error. The
 * phase and code are the protocol; the message exists only for operators and
 * audit history.
 */
export function classifyExecutorFailure(failure: ExecutorFailure): ExecutorHealthVerdict {
  const auditError = `${failure.errorCode}: ${failure.error}`;

  switch (failure.errorStage) {
    case 'execute':
      if (failure.errorCode === 'EXECUTION_TIMEOUT') {
        return { status: 'UNKNOWN', error: auditError };
      }
      // Invocation proves that the package loaded and exposed a callable tool.
      // Validation, credentials, and downstream API failures are not registry
      // breakage, even when the invocation itself returns an error.
      return { status: 'HEALTHY', error: null };
    case 'load':
      // A factory that explicitly requires configuration cannot be evaluated
      // by the credential-free registry sweep. Preserve the prior verdict.
      if (failure.errorCode === 'TOOL_CONFIGURATION_REQUIRED' || failure.retryable) {
        return { status: 'UNKNOWN', error: auditError };
      }
      return { status: 'BROKEN', error: auditError };
    case 'request':
    case 'executor':
      // These observations describe the caller or executor, not the tool.
      return { status: 'UNKNOWN', error: auditError };
  }
}

export function indeterminateExecutorResult(message: string): ExecutorHealthVerdict {
  return { status: 'UNKNOWN', error: message };
}

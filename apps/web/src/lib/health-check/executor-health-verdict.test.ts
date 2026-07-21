import { describe, expect, it } from 'vitest';
import { classifyExecutorFailure } from './executor-health-verdict';

describe('classifyExecutorFailure', () => {
  it('classifies by typed execution stage, independent of message wording', () => {
    for (const error of ['API key is required', 'segmentation fault', 'anything at all']) {
      expect(
        classifyExecutorFailure({
          success: false,
          error,
          errorStage: 'execute',
          errorCode: 'TOOL_EXECUTION_FAILED',
          retryable: false,
        })
      ).toEqual({ status: 'HEALTHY', error: null });
    }
  });

  it('marks deterministic load failures broken', () => {
    expect(
      classifyExecutorFailure({
        success: false,
        error: 'arbitrary operator detail',
        errorStage: 'load',
        errorCode: 'TOOL_NOT_FOUND',
        retryable: false,
      })
    ).toEqual({ status: 'BROKEN', error: 'TOOL_NOT_FOUND: arbitrary operator detail' });
  });

  it('preserves prior state when configuration is required or a load failure is retryable', () => {
    expect(
      classifyExecutorFailure({
        success: false,
        error: 'factory needs configuration',
        errorStage: 'load',
        errorCode: 'TOOL_CONFIGURATION_REQUIRED',
        retryable: false,
      }).status
    ).toBe('UNKNOWN');

    expect(
      classifyExecutorFailure({
        success: false,
        error: 'temporary package mirror failure',
        errorStage: 'load',
        errorCode: 'PACKAGE_IMPORT_FAILED',
        retryable: true,
      }).status
    ).toBe('UNKNOWN');
  });

  it('never assigns tool blame to request or executor failures', () => {
    expect(
      classifyExecutorFailure({
        success: false,
        error: 'invalid caller payload',
        errorStage: 'request',
        errorCode: 'INVALID_REQUEST',
        retryable: false,
      }).status
    ).toBe('UNKNOWN');

    expect(
      classifyExecutorFailure({
        success: false,
        error: 'executor crashed',
        errorStage: 'executor',
        errorCode: 'EXECUTOR_INTERNAL_ERROR',
        retryable: true,
      }).status
    ).toBe('UNKNOWN');
  });

  it('keeps a timed-out invocation indeterminate', () => {
    expect(
      classifyExecutorFailure({
        success: false,
        error: 'execution exceeded the deadline',
        errorStage: 'execute',
        errorCode: 'EXECUTION_TIMEOUT',
        retryable: true,
      }).status
    ).toBe('UNKNOWN');
  });
});

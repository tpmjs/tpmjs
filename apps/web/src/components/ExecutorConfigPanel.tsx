'use client';

import type { ExecutorConfig } from '@tpmjs/types/executor';
import { Button } from '@tpmjs/ui/Button/Button';
import { FormField } from '@tpmjs/ui/FormField/FormField';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import Link from 'next/link';
import { useState } from 'react';

interface ExecutorConfigPanelProps {
  value: ExecutorConfig | null;
  onChange: (config: ExecutorConfig | null) => void;
  disabled?: boolean;
}

interface VerificationResult {
  valid: boolean;
  healthCheck?: {
    healthy: boolean;
    response?: { status: string; version?: string };
  };
  testExecution?: {
    success: boolean;
    executionTimeMs: number;
  };
  errors: string[];
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Component has multiple states for executor configuration
export function ExecutorConfigPanel({
  value,
  onChange,
  disabled = false,
}: ExecutorConfigPanelProps): React.ReactElement {
  const [executorType, setExecutorType] = useState<'default' | 'custom_url'>(
    value?.type === 'custom_url' ? 'custom_url' : 'default'
  );
  const [customUrl, setCustomUrl] = useState(value?.type === 'custom_url' ? value.url : '');
  const [apiKey, setApiKey] = useState(value?.type === 'custom_url' ? (value.apiKey ?? '') : '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleTypeChange = (type: 'default' | 'custom_url') => {
    setExecutorType(type);
    setVerificationResult(null);
    setUrlError(null);

    if (type === 'default') {
      onChange({ type: 'default' });
    } else {
      // Don't update parent until URL is provided
      if (customUrl) {
        onChange({
          type: 'custom_url',
          url: customUrl,
          apiKey: apiKey || undefined,
        });
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setCustomUrl(url);
    setVerificationResult(null);
    setUrlError(null);

    if (url) {
      onChange({
        type: 'custom_url',
        url,
        apiKey: apiKey || undefined,
      });
    }
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);

    if (customUrl) {
      onChange({
        type: 'custom_url',
        url: customUrl,
        apiKey: key || undefined,
      });
    }
  };

  const handleVerify = async () => {
    if (!customUrl) {
      setUrlError('URL is required');
      return;
    }

    // Validate URL format
    try {
      new URL(customUrl);
    } catch {
      setUrlError('Invalid URL format');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setUrlError(null);

    try {
      const response = await fetch('/api/executors/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customUrl, apiKey: apiKey || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data.data);
      } else {
        setUrlError(data.error?.message || 'Verification failed');
      }
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : 'Failed to verify executor');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon="link" className="w-4 h-4 text-foreground-secondary" />
        <h3 className="text-sm font-medium text-foreground">Executor Configuration</h3>
      </div>

      <p className="text-xs text-foreground-tertiary">
        Choose where tools in this collection/agent will be executed.{' '}
        <Link href="/docs/executors" className="text-primary hover:underline">
          Learn more
        </Link>
      </p>

      {/* Executor Type Selection */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleTypeChange('default')}
          disabled={disabled}
          className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
            executorType === 'default'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-foreground-secondary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                executorType === 'default'
                  ? 'border-primary bg-primary'
                  : 'border-foreground-tertiary'
              }`}
            >
              {executorType === 'default' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
            <span className="font-medium text-sm text-foreground">TPMJS Default</span>
          </div>
          <p className="text-xs text-foreground-tertiary mt-1 ml-6">
            Free, managed executor hosted by TPMJS
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('custom_url')}
          disabled={disabled}
          className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
            executorType === 'custom_url'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-foreground-secondary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                executorType === 'custom_url'
                  ? 'border-primary bg-primary'
                  : 'border-foreground-tertiary'
              }`}
            >
              {executorType === 'custom_url' && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </div>
            <span className="font-medium text-sm text-foreground">Custom Executor</span>
          </div>
          <p className="text-xs text-foreground-tertiary mt-1 ml-6">
            Self-hosted executor on your infrastructure
          </p>
        </button>
      </div>

      {/* Custom URL Configuration */}
      {executorType === 'custom_url' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <FormField
            label="Executor URL"
            htmlFor="executor-url"
            required
            error={urlError ?? undefined}
            state={urlError ? 'error' : 'default'}
            helperText="The base URL of your executor (e.g., https://my-executor.vercel.app)"
          >
            <Input
              id="executor-url"
              type="url"
              value={customUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://my-executor.vercel.app"
              state={urlError ? 'error' : 'default'}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label="API Key (Optional)"
            htmlFor="executor-api-key"
            helperText="If your executor requires authentication"
          >
            <Input
              id="executor-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk-..."
              disabled={disabled}
            />
          </FormField>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleVerify}
              loading={isVerifying}
              disabled={disabled || !customUrl}
            >
              <Icon icon="check" className="w-4 h-4 mr-1" />
              Verify Connection
            </Button>

            <Link href="/docs/executors#deploy" className="text-xs text-primary hover:underline">
              Deploy your own executor
            </Link>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                verificationResult.valid
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  icon={verificationResult.valid ? 'check' : 'x'}
                  className={`w-4 h-4 ${
                    verificationResult.valid ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <span
                  className={`font-medium ${
                    verificationResult.valid ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {verificationResult.valid ? 'Executor verified' : 'Verification failed'}
                </span>
              </div>

              {verificationResult.healthCheck && (
                <p className="text-xs text-foreground-secondary mt-2 ml-6">
                  Health: {verificationResult.healthCheck.response?.status ?? 'unknown'}
                  {verificationResult.healthCheck.response?.version &&
                    ` (v${verificationResult.healthCheck.response.version})`}
                </p>
              )}

              {verificationResult.testExecution && (
                <p className="text-xs text-foreground-secondary ml-6">
                  Test execution: {verificationResult.testExecution.executionTimeMs}ms
                </p>
              )}

              {verificationResult.errors.length > 0 && (
                <ul className="text-xs text-red-400 mt-2 ml-6 list-disc list-inside">
                  {verificationResult.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

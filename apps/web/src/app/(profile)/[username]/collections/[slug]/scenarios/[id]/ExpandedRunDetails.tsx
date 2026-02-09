import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { ScenarioRun } from './types';

interface ExpandedRunDetailsProps {
  run: ScenarioRun;
}

/** Displays passed and failed assertions */
function AssertionsSection({ assertions }: { assertions: { passed: string[]; failed: string[] } }) {
  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
        Assertions
      </h4>
      <div className="p-3 bg-surface-secondary rounded-lg space-y-3">
        {assertions.passed.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-success text-sm font-medium mb-1.5">
              <Icon icon="check" className="w-4 h-4" />
              Passed ({assertions.passed.length})
            </div>
            <div className="space-y-1 ml-5">
              {assertions.passed.map((assertion) => (
                <div key={assertion} className="text-sm text-foreground-secondary font-mono">
                  {assertion}
                </div>
              ))}
            </div>
          </div>
        )}
        {assertions.failed.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-error text-sm font-medium mb-1.5">
              <Icon icon="x" className="w-4 h-4" />
              Failed ({assertions.failed.length})
            </div>
            <div className="space-y-1 ml-5">
              {assertions.failed.map((assertion) => (
                <div key={assertion} className="text-sm text-error/80 font-mono">
                  {assertion}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Displays conversation messages */
function ConversationSection({
  conversation,
}: {
  conversation: NonNullable<ScenarioRun['conversation']>;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
          Conversation History
        </h4>
      </div>
      <div className="space-y-4">
        {conversation.map((msg) => (
          <ConversationMessage key={msg.id} msg={msg} />
        ))}
      </div>
    </div>
  );
}

/** Single conversation message */
function ConversationMessage({ msg }: { msg: NonNullable<ScenarioRun['conversation']>[number] }) {
  if (msg.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg p-4 bg-primary text-primary-foreground">
          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
        </div>
      </div>
    );
  }

  if (msg.role === 'ASSISTANT') {
    return msg.content ? (
      <div className="space-y-2">
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg p-4 bg-surface-secondary">
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">{msg.content}</div>
          </div>
        </div>
      </div>
    ) : null;
  }

  if (msg.role === 'TOOL') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg border border-border bg-surface-secondary overflow-hidden">
          <div className="p-3">
            <div className="text-sm font-medium text-foreground">
              {msg.toolName || 'Unknown Tool'}
            </div>
            {msg.toolResult != null && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <pre className="text-xs text-success overflow-x-auto whitespace-pre-wrap break-all">
                  {typeof msg.toolResult === 'string'
                    ? msg.toolResult
                    : JSON.stringify(msg.toolResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: display component with many conditional sections
export function ExpandedRunDetails({ run }: ExpandedRunDetailsProps) {
  const hasAssertions =
    run.assertions && (run.assertions.passed.length > 0 || run.assertions.failed.length > 0);

  return (
    <div className="px-4 pb-4 border-t border-border/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Evaluator */}
        {run.evaluator?.verdict && (
          <div className="p-3 bg-surface-secondary rounded-lg">
            <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
              LLM Evaluation
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                className={
                  run.evaluator.verdict === 'pass'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-error/10 text-error border-error/20'
                }
              >
                <Icon
                  icon={run.evaluator.verdict === 'pass' ? 'check' : 'x'}
                  className="w-3 h-3 mr-1"
                />
                {run.evaluator.verdict === 'pass' ? 'Pass' : 'Fail'}
              </Badge>
              {run.evaluator.model && (
                <Badge variant="secondary" size="sm">
                  {run.evaluator.model}
                </Badge>
              )}
            </div>
            {run.evaluator?.reason && (
              <p className="text-sm text-foreground-secondary">{run.evaluator.reason}</p>
            )}
          </div>
        )}

        {/* Usage Stats */}
        <div className="p-3 bg-surface-secondary rounded-lg">
          <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
            Usage
          </h4>
          {run.usage ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-foreground-tertiary">Duration:</span>{' '}
                <span className="text-foreground">
                  {run.usage?.executionTimeMs
                    ? `${Math.floor(run.usage.executionTimeMs / 1000)}s`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-foreground-tertiary">Tokens:</span>{' '}
                <span className="text-foreground">
                  {run.usage?.totalTokens?.toLocaleString() || '—'}
                </span>
              </div>
              <div>
                <span className="text-foreground-tertiary">Retries:</span>{' '}
                <span className="text-foreground">{run.retryCount || 0}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground-secondary">No usage data available</div>
          )}
        </div>
      </div>

      {/* Assertions Results */}
      {hasAssertions && run.assertions && <AssertionsSection assertions={run.assertions} />}

      {/* Output (if owner) */}
      {run.output && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
            Output
          </h4>
          <pre className="p-3 bg-surface-secondary rounded-lg text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
            {run.output}
          </pre>
        </div>
      )}

      {/* Error Log (if owner and error) */}
      {run.errorLog && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-error uppercase tracking-wide mb-2">
            Error Log
          </h4>
          <pre className="p-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error overflow-x-auto whitespace-pre-wrap">
            {run.errorLog}
          </pre>
        </div>
      )}

      {/* Conversation History */}
      {run.conversation && <ConversationSection conversation={run.conversation} />}
    </div>
  );
}

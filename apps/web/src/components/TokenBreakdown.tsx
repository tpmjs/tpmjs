'use client';

/**
 * TokenBreakdown component
 * Visualizes token usage breakdown with horizontal bars
 */

import type { TokenBreakdown as TokenData } from '@/lib/ai-agent/tool-executor-agent';

interface TokenBreakdownProps {
  tokens: TokenData;
}

interface TokenBar {
  label: string;
  tokens: number;
  color: string;
  bgColor: string;
}

export function TokenBreakdown({ tokens }: TokenBreakdownProps): React.ReactElement {
  const { inputTokens, toolDescTokens, schemaTokens, outputTokens, totalTokens, estimatedCost } =
    tokens;

  const bars: TokenBar[] = [
    {
      label: 'Input',
      tokens: inputTokens,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      label: 'Tool Description',
      tokens: toolDescTokens,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
    {
      label: 'Schema',
      tokens: schemaTokens,
      color: 'bg-green-500',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      label: 'Output',
      tokens: outputTokens,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
  ];

  const getPercentage = (value: number): number => {
    if (totalTokens === 0) return 0;
    return (value / totalTokens) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {bars.map((bar) => {
          const percentage = getPercentage(bar.tokens);
          return (
            <div key={bar.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{bar.label}</span>
                <span className="text-foreground-secondary">
                  {bar.tokens.toLocaleString()} tokens ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className={`h-2 rounded-full ${bar.bgColor}`}>
                <div
                  className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-foreground">Total Tokens</span>
          <span className="font-semibold text-foreground">{totalTokens.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Estimated Cost</span>
          <span className="text-foreground-secondary">${estimatedCost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

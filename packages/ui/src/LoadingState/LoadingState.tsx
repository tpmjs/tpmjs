import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { Spinner } from '../Spinner/Spinner';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional loading message */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    spinnerSize: 'sm' as const,
    messageClass: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    container: 'py-16',
    spinnerSize: 'md' as const,
    messageClass: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    container: 'py-24',
    spinnerSize: 'lg' as const,
    messageClass: 'text-sm',
    gap: 'gap-4',
  },
};

/**
 * LoadingState component
 *
 * A consistent loading state pattern with spinner and optional message.
 *
 * @example
 * ```tsx
 * import { LoadingState } from '@tpmjs/ui/LoadingState/LoadingState';
 *
 * function MyComponent() {
 *   if (isLoading) {
 *     return <LoadingState message="Loading tools..." />;
 *   }
 *   return <div>Content</div>;
 * }
 * ```
 */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, message, size = 'md', ...props }, ref) => {
    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          config.container,
          config.gap,
          className
        )}
        {...props}
      >
        <Spinner size={config.spinnerSize} />
        {message && (
          <span
            className={cn(
              'text-foreground-secondary font-mono tracking-wide',
              config.messageClass
            )}
          >
            {message}
          </span>
        )}
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';

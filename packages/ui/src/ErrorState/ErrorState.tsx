import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional title (defaults to "Error") */
  title?: string;
  /** Error message to display */
  message: string;
  /** Optional retry callback - shows retry button if provided */
  onRetry?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    iconSize: 'md' as const,
    title: 'text-base',
    message: 'text-sm',
  },
  md: {
    container: 'py-12',
    iconSize: 'lg' as const,
    title: 'text-lg',
    message: 'text-sm',
  },
  lg: {
    container: 'py-16',
    iconSize: 'lg' as const,
    title: 'text-xl',
    message: 'text-base',
  },
};

/**
 * ErrorState component
 *
 * A consistent error state pattern for displaying error messages with optional retry.
 *
 * @example
 * ```tsx
 * import { ErrorState } from '@tpmjs/ui/ErrorState/ErrorState';
 *
 * function MyComponent() {
 *   return (
 *     <ErrorState
 *       message="Failed to load data"
 *       onRetry={() => refetch()}
 *     />
 *   );
 * }
 * ```
 */
export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title = 'Error',
      message,
      onRetry,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn('text-center', config.container, className)}
        {...props}
      >
        <Icon
          icon="alertCircle"
          size={config.iconSize}
          className="mx-auto text-error mb-4"
        />
        <h2 className={cn('font-medium text-foreground mb-2', config.title)}>
          {title}
        </h2>
        <p className={cn('text-foreground-secondary mb-4', config.message)}>
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </div>
    );
  }
);

ErrorState.displayName = 'ErrorState';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { Icon, type IconName } from '../Icon/Icon';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon: IconName;
  /** Title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action element (button, link, etc.) */
  action?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    iconContainer: 'w-12 h-12',
    iconSize: 'md' as const,
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    iconContainer: 'w-16 h-16',
    iconSize: 'lg' as const,
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    iconContainer: 'w-20 h-20',
    iconSize: 'lg' as const,
    title: 'text-xl',
    description: 'text-base',
  },
};

/**
 * EmptyState component
 *
 * A consistent empty state pattern for displaying when no data is available.
 * Use this for empty lists, search results with no matches, or first-time states.
 *
 * @example
 * ```tsx
 * import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   return (
 *     <EmptyState
 *       icon="folder"
 *       title="No collections found"
 *       description="Create your first collection to get started."
 *       action={<Button>Create Collection</Button>}
 *     />
 *   );
 * }
 * ```
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon, title, description, action, size = 'md', ...props },
    ref
  ) => {
    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn('text-center', config.container, className)}
        {...props}
      >
        <div
          className={cn(
            'rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4',
            config.iconContainer
          )}
        >
          <Icon icon={icon} size={config.iconSize} className="text-primary" />
        </div>
        <h3
          className={cn(
            'font-medium text-foreground mb-2',
            config.title
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              'text-foreground-secondary mb-4 max-w-md mx-auto',
              config.description
            )}
          >
            {description}
          </p>
        )}
        {action && <div className="flex justify-center">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

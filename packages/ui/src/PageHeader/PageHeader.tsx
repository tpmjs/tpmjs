import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action elements (buttons, links, etc.) */
  actions?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'mb-4 space-y-1',
    title: 'text-xl sm:text-2xl',
    description: 'text-sm',
  },
  md: {
    container: 'mb-6 space-y-2',
    title: 'text-2xl sm:text-3xl',
    description: 'text-base',
  },
  lg: {
    container: 'mb-8 space-y-4',
    title: 'text-2xl sm:text-3xl md:text-4xl',
    description: 'text-lg',
  },
};

/**
 * PageHeader component
 *
 * A consistent page header pattern with title, description, and optional actions.
 *
 * @example
 * ```tsx
 * import { PageHeader } from '@tpmjs/ui/PageHeader/PageHeader';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyPage() {
 *   return (
 *     <PageHeader
 *       title="Tool Registry"
 *       description="Browse and discover AI agent tools"
 *       actions={<Button>Add Tool</Button>}
 *     />
 *   );
 * }
 * ```
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    { className, title, description, actions, size = 'md', ...props },
    ref
  ) => {
    const config = sizeConfig[size];

    return (
      <div ref={ref} className={cn(config.container, className)} {...props}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className={cn('font-bold text-foreground', config.title)}>
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  'text-foreground-secondary',
                  config.description
                )}
              >
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

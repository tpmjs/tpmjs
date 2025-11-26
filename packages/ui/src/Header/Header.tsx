import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { HeaderProps } from './types';
import { headerActionsVariants, headerTitleVariants, headerVariants } from './variants';

/**
 * Header component
 *
 * A flexible header bar with title and action slots.
 * Supports sticky positioning and responsive sizing.
 *
 * @example
 * ```tsx
 * import { Header } from '@tpmjs/ui/Header/Header';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   return (
 *     <Header
 *       title="TPMJS Registry"
 *       actions={<Button variant="ghost">Sign In</Button>}
 *       size="md"
 *       sticky={true}
 *     />
 *   );
 * }
 * ```
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ className, title, actions, size = 'md', sticky = false, children, ...props }, ref) => {
    return (
      <header
        className={cn(
          headerVariants({
            size,
            sticky: sticky ? 'true' : 'false',
          }),
          className
        )}
        ref={ref}
        {...props}
      >
        {title && (
          <div
            className={headerTitleVariants({
              size,
            })}
            data-testid="header-title"
          >
            {title}
          </div>
        )}
        {children && (
          <div className="flex-1 flex items-center justify-center" data-testid="header-children">
            {children}
          </div>
        )}
        {actions && (
          <div
            className={headerActionsVariants({
              size,
            })}
            data-testid="header-actions"
          >
            {actions}
          </div>
        )}
      </header>
    );
  }
);

Header.displayName = 'Header';

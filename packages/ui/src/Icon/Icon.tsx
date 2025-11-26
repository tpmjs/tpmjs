import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { type IconName, icons } from './icons';
import type { IconProps } from './types';
import { iconVariants } from './variants';

export type { IconName };

/**
 * Icon component
 *
 * Renders SVG icons with consistent sizing and styling.
 * Icons inherit text color via currentColor.
 *
 * @example
 * ```tsx
 * import { Icon } from '@tpmjs/ui/Icon/Icon';
 *
 * function MyComponent() {
 *   return <Icon icon="github" size="md" className="text-zinc-400" />;
 * }
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ className, icon, size = 'md', ...props }, ref) => {
    const iconData = icons[icon];

    return (
      <svg
        ref={ref}
        className={cn(
          iconVariants({
            size,
          }),
          className
        )}
        viewBox={iconData.viewBox}
        fill="currentColor"
        aria-hidden={props['aria-hidden'] ?? true}
        {...props}
      >
        <path d={iconData.path} />
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

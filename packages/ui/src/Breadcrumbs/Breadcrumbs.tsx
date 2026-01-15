'use client';

import { cn } from '@tpmjs/utils/cn';
import {
  Children,
  forwardRef,
  isValidElement,
  useMemo,
  useState,
} from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import type {
  BreadcrumbEllipsisProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbSeparator,
  BreadcrumbSeparatorProps,
  BreadcrumbsProps,
} from './types';
import {
  breadcrumbEllipsisVariants,
  breadcrumbIconVariants,
  breadcrumbItemVariants,
  breadcrumbLinkVariants,
  breadcrumbSeparatorVariants,
  breadcrumbsListVariants,
  breadcrumbsVariants,
} from './variants';

/**
 * Get the separator icon based on type
 */
function getSeparatorIcon(separator: BreadcrumbSeparator): IconName {
  switch (separator) {
    case 'chevron':
      return 'chevronRight';
    case 'arrow':
      return 'arrowRight';
    case 'dot':
      return 'circle';
    case 'slash':
    default:
      return 'slash';
  }
}

/**
 * Breadcrumbs component
 *
 * A navigation component that shows the user's location in a hierarchy.
 *
 * @example
 * ```tsx
 * import { Breadcrumbs, BreadcrumbItem } from '@tpmjs/ui/Breadcrumbs/Breadcrumbs';
 *
 * function MyComponent() {
 *   return (
 *     <Breadcrumbs>
 *       <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *       <BreadcrumbItem href="/tools">Tools</BreadcrumbItem>
 *       <BreadcrumbItem current>Current Tool</BreadcrumbItem>
 *     </Breadcrumbs>
 *   );
 * }
 * ```
 */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  (
    {
      separator = 'slash',
      maxItems,
      itemsBeforeCollapse = 1,
      itemsAfterCollapse = 1,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState(false);

    const items = useMemo(() => {
      return Children.toArray(children).filter(isValidElement);
    }, [children]);

    const shouldCollapse = maxItems && items.length > maxItems && !expanded;

    const visibleItems = useMemo(() => {
      if (!shouldCollapse) return items;

      const start = items.slice(0, itemsBeforeCollapse);
      const end = items.slice(-itemsAfterCollapse);

      return [...start, 'ellipsis', ...end];
    }, [items, shouldCollapse, itemsBeforeCollapse, itemsAfterCollapse]);

    const renderSeparator = (key: string) => {
      if (typeof separator === 'string') {
        const iconName = getSeparatorIcon(separator as BreadcrumbSeparator);
        return (
          <BreadcrumbSeparatorComponent key={key}>
            <Icon icon={iconName} size="xs" />
          </BreadcrumbSeparatorComponent>
        );
      }
      return (
        <BreadcrumbSeparatorComponent key={key}>
          {separator}
        </BreadcrumbSeparatorComponent>
      );
    };

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn(breadcrumbsVariants({}), className)}
        {...props}
      >
        <ol className={breadcrumbsListVariants({})}>
          {visibleItems.map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <li key="ellipsis" className={breadcrumbItemVariants({})}>
                  {index > 0 && renderSeparator(`sep-before-ellipsis`)}
                  <BreadcrumbEllipsis onClick={() => setExpanded(true)} />
                </li>
              );
            }

            return (
              <li
                key={index}
                className={breadcrumbItemVariants({})}
              >
                {index > 0 && renderSeparator(`sep-${index}`)}
                {item}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

/**
 * BreadcrumbItem component
 */
export const BreadcrumbItem = forwardRef<HTMLSpanElement, BreadcrumbItemProps>(
  ({ current = false, href, icon, children, className, ...props }, ref) => {
    const content = (
      <>
        {icon && <span className={breadcrumbIconVariants({})}>{icon}</span>}
        {children}
      </>
    );

    if (current) {
      return (
        <span
          ref={ref}
          aria-current="page"
          className={cn(breadcrumbLinkVariants({ current: 'true' }), className)}
          {...props}
        >
          {content}
        </span>
      );
    }

    if (href) {
      return (
        <a
          href={href}
          className={cn(breadcrumbLinkVariants({ current: 'false' }), className)}
          {...(props as any)}
        >
          {content}
        </a>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(breadcrumbLinkVariants({ current: 'false' }), className)}
        {...props}
      >
        {content}
      </span>
    );
  }
);

BreadcrumbItem.displayName = 'BreadcrumbItem';

/**
 * BreadcrumbLink component
 */
export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ href, children, className, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(breadcrumbLinkVariants({ current: 'false' }), className)}
      {...props}
    >
      {children}
    </a>
  )
);

BreadcrumbLink.displayName = 'BreadcrumbLink';

/**
 * BreadcrumbSeparator component (internal)
 */
const BreadcrumbSeparatorComponent = forwardRef<HTMLSpanElement, BreadcrumbSeparatorProps>(
  ({ children, className, ...props }, ref) => (
    <span
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn(breadcrumbSeparatorVariants({}), className)}
      {...props}
    >
      {children ?? '/'}
    </span>
  )
);

BreadcrumbSeparatorComponent.displayName = 'BreadcrumbSeparator';

// Export as BreadcrumbSeparator
export { BreadcrumbSeparatorComponent as BreadcrumbSeparator };

/**
 * BreadcrumbEllipsis component
 */
export const BreadcrumbEllipsis = forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="button"
      aria-label="Show more breadcrumbs"
      className={cn(breadcrumbEllipsisVariants({}), className)}
      {...props}
    >
      <Icon icon="moreHorizontal" size="sm" />
    </span>
  )
);

BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

/**
 * BreadcrumbPage component
 *
 * Represents the current page in breadcrumbs (non-link, just text)
 */
export const BreadcrumbPage = forwardRef<HTMLSpanElement, Omit<BreadcrumbItemProps, 'href' | 'current'>>(
  ({ children, className, ...props }, ref) => (
    <span
      ref={ref}
      aria-current="page"
      className={cn(breadcrumbLinkVariants({ current: 'true' }), className)}
      {...props}
    >
      {children}
    </span>
  )
);

BreadcrumbPage.displayName = 'BreadcrumbPage';

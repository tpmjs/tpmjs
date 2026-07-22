import { cn } from '@tpmjs/utils/cn';
import { forwardRef, type KeyboardEvent } from 'react';
import type { Tab, TabsProps } from './types';
import { tabButtonVariants, tabCountVariants, tabsContainerVariants } from './variants';

// Re-export types for consumers
export type { Tab, TabsProps };

/**
 * Tabs component
 *
 * Displays a horizontal list of tabs with optional count badges.
 * Supports keyboard navigation and accessibility.
 *
 * @example
 * ```tsx
 * import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
 * import { useState } from 'react';
 *
 * function MyComponent() {
 *   const [activeTab, setActiveTab] = useState('all');
 *
 *   return (
 *     <Tabs
 *       tabs={[
 *         { id: 'all', label: 'All Tools', count: 1234 },
 *         { id: 'featured', label: 'Featured', count: 42 },
 *       ]}
 *       activeTab={activeTab}
 *       onTabChange={setActiveTab}
 *       size="md"
 *     />
 *   );
 * }
 * ```
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    { className, tabs, activeTab, onTabChange, size = 'md', variant = 'default', ...props },
    ref
  ) => {
    const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number): void => {
      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === null || nextIndex < 0) return;

      const nextTab = tabs[nextIndex];
      if (!nextTab) return;

      event.preventDefault();
      onTabChange(nextTab.id);
      const buttons =
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    };

    return (
      <div
        className={cn(
          tabsContainerVariants({
            size,
            variant,
          }),
          className
        )}
        role="tablist"
        ref={ref}
        {...props}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              aria-label={tab.count === undefined ? undefined : `${tab.label}, ${tab.count} items`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={tabButtonVariants({
                size,
                active: isActive ? 'true' : 'false',
                variant,
              })}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => moveFocus(event, index)}
              data-testid={`tab-${tab.id}`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={tabCountVariants({
                    active: isActive ? 'true' : 'false',
                  })}
                  aria-hidden="true"
                >
                  {tab.count.toString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

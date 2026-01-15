'use client';

import { cn } from '@tpmjs/utils/cn';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';
import { Icon } from '../Icon/Icon';
import type {
  AccordionContentProps,
  AccordionContextValue,
  AccordionItemContextValue,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps,
} from './types';
import {
  accordionContentInnerVariants,
  accordionContentVariants,
  accordionItemVariants,
  accordionTriggerIconVariants,
  accordionTriggerVariants,
  accordionVariants,
} from './variants';

// Accordion context
const AccordionContext = createContext<AccordionContextValue | null>(null);

// Accordion item context
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

/**
 * Accordion component
 *
 * A vertically stacked set of interactive headings that reveal content.
 *
 * @example
 * ```tsx
 * import {
 *   Accordion,
 *   AccordionItem,
 *   AccordionTrigger,
 *   AccordionContent,
 * } from '@tpmjs/ui/Accordion/Accordion';
 *
 * function MyComponent() {
 *   return (
 *     <Accordion type="single" defaultValue="item-1">
 *       <AccordionItem value="item-1">
 *         <AccordionTrigger>Section 1</AccordionTrigger>
 *         <AccordionContent>Content for section 1</AccordionContent>
 *       </AccordionItem>
 *       <AccordionItem value="item-2">
 *         <AccordionTrigger>Section 2</AccordionTrigger>
 *         <AccordionContent>Content for section 2</AccordionContent>
 *       </AccordionItem>
 *     </Accordion>
 *   );
 * }
 * ```
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      type = 'single',
      value: controlledValue,
      defaultValue,
      onValueChange,
      collapsible = true,
      variant = 'default',
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Normalize value to array format internally
    const normalizeValue = (val: string | string[] | undefined): string[] => {
      if (val === undefined) return [];
      return Array.isArray(val) ? val : [val];
    };

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string[]>(
      normalizeValue(defaultValue)
    );

    const value = isControlled ? normalizeValue(controlledValue) : internalValue;

    const toggleItem = useCallback(
      (itemValue: string) => {
        let newValue: string[];

        if (type === 'single') {
          if (value.includes(itemValue)) {
            // If collapsible, allow closing; otherwise keep it open
            newValue = collapsible ? [] : value;
          } else {
            newValue = [itemValue];
          }
        } else {
          // Multiple: toggle the item
          if (value.includes(itemValue)) {
            newValue = value.filter((v) => v !== itemValue);
          } else {
            newValue = [...value, itemValue];
          }
        }

        if (!isControlled) {
          setInternalValue(newValue);
        }

        // Emit in the format expected by the type
        if (type === 'single') {
          onValueChange?.(newValue[0] || '');
        } else {
          onValueChange?.(newValue);
        }
      },
      [type, value, collapsible, isControlled, onValueChange]
    );

    const contextValue = useMemo(
      () => ({
        type,
        value,
        toggleItem,
        variant,
      }),
      [type, value, toggleItem, variant]
    );

    return (
      <AccordionContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(accordionVariants({ variant }), className)}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';

/**
 * AccordionItem component
 */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, disabled = false, children, className, ...props }, ref) => {
    const context = useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionItem must be used within an Accordion');
    }

    const isExpanded = context.value.includes(value);

    const itemContextValue = useMemo(
      () => ({
        value,
        disabled,
        isExpanded,
      }),
      [value, disabled, isExpanded]
    );

    return (
      <AccordionItemContext.Provider value={itemContextValue}>
        <div
          ref={ref}
          data-state={isExpanded ? 'open' : 'closed'}
          className={cn(accordionItemVariants({ variant: context.variant }), className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';

/**
 * AccordionTrigger component
 */
export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ icon, children, className, ...props }, ref) => {
    const accordionContext = useContext(AccordionContext);
    const itemContext = useContext(AccordionItemContext);

    if (!accordionContext || !itemContext) {
      throw new Error('AccordionTrigger must be used within an AccordionItem');
    }

    const { toggleItem } = accordionContext;
    const { value, disabled, isExpanded } = itemContext;

    const triggerId = useId();
    const contentId = useId();

    const handleClick = useCallback(() => {
      if (!disabled) {
        toggleItem(value);
      }
    }, [disabled, toggleItem, value]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    return (
      <button
        ref={ref}
        type="button"
        id={triggerId}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        disabled={disabled}
        className={cn(accordionTriggerVariants({ disabled: disabled ? 'true' : 'false' }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <span className="flex-1">{children}</span>
        <span className={accordionTriggerIconVariants({ expanded: isExpanded ? 'true' : 'false' })}>
          {icon ?? <Icon icon="chevronDown" size="sm" />}
        </span>
      </button>
    );
  }
);

AccordionTrigger.displayName = 'AccordionTrigger';

/**
 * AccordionContent component
 */
export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ children, className, ...props }, ref) => {
    const itemContext = useContext(AccordionItemContext);

    if (!itemContext) {
      throw new Error('AccordionContent must be used within an AccordionItem');
    }

    const { isExpanded } = itemContext;

    return (
      <div
        ref={ref}
        role="region"
        aria-hidden={!isExpanded}
        className={cn(accordionContentVariants({ expanded: isExpanded ? 'true' : 'false' }), className)}
        {...props}
      >
        <div className={accordionContentInnerVariants({})}>
          {children}
        </div>
      </div>
    );
  }
);

AccordionContent.displayName = 'AccordionContent';

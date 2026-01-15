import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Accordion type - single or multiple items can be expanded
 */
export type AccordionType = 'single' | 'multiple';

/**
 * Accordion variant types
 */
export type AccordionVariant = 'default' | 'bordered' | 'separated';

/**
 * Accordion component props
 */
export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Whether single or multiple items can be expanded
   * @default 'single'
   */
  type?: AccordionType;

  /**
   * Value of expanded item(s) - controlled mode
   * For single: string | undefined
   * For multiple: string[]
   */
  value?: string | string[];

  /**
   * Default expanded value(s) - uncontrolled mode
   */
  defaultValue?: string | string[];

  /**
   * Callback when expanded state changes
   */
  onValueChange?: (value: string | string[]) => void;

  /**
   * Whether to collapse others when opening an item (only for type="single")
   * @default true
   */
  collapsible?: boolean;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: AccordionVariant;

  /**
   * Accordion items
   */
  children: ReactNode;
}

/**
 * AccordionItem component props
 */
export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Unique value for this item
   */
  value: string;

  /**
   * Whether this item is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Item content (trigger + panel)
   */
  children: ReactNode;
}

/**
 * AccordionTrigger component props
 */
export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  /**
   * Icon to display (defaults to chevron)
   */
  icon?: ReactNode;

  /**
   * Trigger content
   */
  children: ReactNode;
}

/**
 * AccordionContent component props
 */
export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Content to display when expanded
   */
  children: ReactNode;
}

/**
 * Accordion ref type
 */
export type AccordionRef = HTMLDivElement;

/**
 * Internal accordion context
 */
export interface AccordionContextValue {
  type: AccordionType;
  value: string[];
  toggleItem: (itemValue: string) => void;
  variant: AccordionVariant;
}

/**
 * Internal accordion item context
 */
export interface AccordionItemContextValue {
  value: string;
  disabled: boolean;
  isExpanded: boolean;
}

import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { SectionProps } from './types';
import { sectionVariants } from './variants';

/**
 * Section component
 *
 * Semantic section wrapper with built-in spacing, backgrounds, and container options.
 * Built with React and JSX for blueprint/editorial layouts.
 *
 * @example
 * ```tsx
 * import { Section } from '@tpmjs/ui/Section/Section';
 *
 * function MyComponent() {
 *   return (
 *     <Section
 *       spacing="lg"
 *       background="blueprint"
 *       container="xl"
 *       centered
 *     >
 *       <h1>Section Content</h1>
 *     </Section>
 *   );
 * }
 * ```
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      as = 'section',
      spacing = 'md',
      background = 'default',
      container = 'none',
      centered = false,
      children,
      ...props
    },
    ref
  ) => {
    const Component = as;

    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={cn(
          sectionVariants({
            spacing,
            background,
            container,
            centered: centered ? 'true' : 'false',
          }),
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Section.displayName = 'Section';

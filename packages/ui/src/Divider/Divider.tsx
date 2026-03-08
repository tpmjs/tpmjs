import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { DividerProps } from './types';
import { dividerVariants } from './variants';

const SPACING_MAP = {
  none: '',
  sm: 'my-2',
  md: 'my-4',
  lg: 'my-6',
  xl: 'my-8',
} as const;

const STYLE_MAP = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
} as const;

const THICKNESS_MAP = {
  thin: 'border-t',
  medium: 'border-t-2',
  thick: 'border-t-4',
} as const;

function getLineClasses(variant: DividerProps['variant'], thickness: DividerProps['thickness']) {
  return cn(
    'flex-1 border-border',
    STYLE_MAP[variant || 'solid'],
    THICKNESS_MAP[thickness || 'thin']
  );
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      className,
      orientation = 'horizontal',
      variant = 'solid',
      thickness = 'thin',
      spacing = 'md',
      label,
      ...props
    },
    ref
  ) => {
    if (label && orientation === 'horizontal') {
      return (
        <div className={cn('flex items-center', SPACING_MAP[spacing], className)}>
          <div className={getLineClasses(variant, thickness)} />
          <span className="px-3 font-mono text-xs text-muted-foreground uppercase">{label}</span>
          <div className={getLineClasses(variant, thickness)} />
        </div>
      );
    }

    return (
      <hr
        ref={ref}
        className={cn(dividerVariants({ orientation, variant, thickness, spacing }), className)}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

import { createElement, forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@tpmjs/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return createElement('div', {
    ref,
    className: cn(
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
      className
    ),
    ...props,
  });
});

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return createElement('div', {
      ref,
      className: cn('flex flex-col space-y-1.5 p-6', className),
      ...props,
    });
  }
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return createElement('h3', {
      ref,
      className: cn('text-2xl font-semibold leading-none tracking-tight', className),
      ...props,
    });
  }
);

CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return createElement('div', {
      ref,
      className: cn('p-6 pt-0', className),
      ...props,
    });
  }
);

CardContent.displayName = 'CardContent';

import type { ComponentPropsWithoutRef } from 'react';

export interface DividerProps extends ComponentPropsWithoutRef<'hr'> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: 'thin' | 'medium' | 'thick';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

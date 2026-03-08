import type { ComponentPropsWithoutRef } from 'react';

export interface AlertProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'destructive';
}

export interface AlertTitleProps extends ComponentPropsWithoutRef<'h5'> {}

export interface AlertDescriptionProps extends ComponentPropsWithoutRef<'div'> {}

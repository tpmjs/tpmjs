import type { ComponentPropsWithoutRef } from 'react';

export interface AlertProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'destructive';
}

export type AlertTitleProps = ComponentPropsWithoutRef<'h5'>;

export type AlertDescriptionProps = ComponentPropsWithoutRef<'div'>;

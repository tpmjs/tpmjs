import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { AlertDescriptionProps, AlertProps, AlertTitleProps } from './types';
import { alertDescriptionVariants, alertTitleVariants, alertVariants } from './variants';

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Alert.displayName = 'Alert';

export const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => {
    return <h5 ref={ref} className={cn(alertTitleVariants(), className)} {...props} />;
  }
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn(alertDescriptionVariants(), className)} {...props} />;
  }
);
AlertDescription.displayName = 'AlertDescription';

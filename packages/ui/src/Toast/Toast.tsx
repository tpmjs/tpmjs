'use client';

import { cn } from '@tpmjs/utils/cn';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon/Icon';
import type {
  ToastContainerProps,
  ToastContextValue,
  ToastPosition,
  ToastProps,
  ToastState,
  ToastVariant,
} from './types';
import {
  toastActionVariants,
  toastCloseButtonVariants,
  toastContainerVariants,
  toastContentVariants,
  toastDescriptionVariants,
  toastIconVariants,
  toastTitleVariants,
  toastVariants,
} from './variants';

/**
 * Get the default icon for a toast variant
 */
function getVariantIcon(variant: ToastVariant): 'checkCircle' | 'xCircle' | 'alertTriangle' | 'info' | 'bell' {
  switch (variant) {
    case 'success':
      return 'checkCircle';
    case 'error':
      return 'xCircle';
    case 'warning':
      return 'alertTriangle';
    case 'info':
      return 'info';
    default:
      return 'bell';
  }
}

/**
 * Toast component
 *
 * A notification component that displays brief messages to the user.
 *
 * @example
 * ```tsx
 * import { Toast } from '@tpmjs/ui/Toast/Toast';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(true);
 *
 *   return (
 *     <Toast
 *       open={open}
 *       onClose={() => setOpen(false)}
 *       title="Success"
 *       description="Your changes have been saved."
 *       variant="success"
 *     />
 *   );
 * }
 * ```
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      variant = 'default',
      action,
      duration = 5000,
      showCloseButton = true,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Auto-dismiss timer
    useEffect(() => {
      if (!open || duration === 0) return;

      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [open, duration, onClose]);

    // Pause timer on hover
    const handleMouseEnter = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (duration === 0) return;
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }, [duration, onClose]);

    if (!open) return null;

    const defaultIcon = getVariantIcon(variant);

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(toastVariants({ variant, state: 'entered' }), className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Icon */}
        <div className={toastIconVariants({ variant })}>
          {icon ?? <Icon icon={defaultIcon} size="sm" />}
        </div>

        {/* Content */}
        <div className={toastContentVariants()}>
          {title && <div className={toastTitleVariants()}>{title}</div>}
          {description && (
            <div className={toastDescriptionVariants()}>{description}</div>
          )}
          {action && <div className={toastActionVariants()}>{action}</div>}
        </div>

        {/* Close button */}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className={toastCloseButtonVariants()}
            aria-label="Dismiss notification"
          >
            <Icon icon="x" size="sm" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

/**
 * ToastContainer component
 *
 * A container that positions toast notifications on the screen.
 *
 * @example
 * ```tsx
 * import { ToastContainer, Toast } from '@tpmjs/ui/Toast/Toast';
 *
 * function MyComponent() {
 *   return (
 *     <ToastContainer position="top-right">
 *       <Toast open={true} onClose={() => {}} title="Hello" />
 *     </ToastContainer>
 *   );
 * }
 * ```
 */
export const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>(
  ({ position = 'bottom-right', children, className, ...props }, ref) => {
    // Only render in browser (for SSR compatibility)
    if (typeof window === 'undefined') return null;

    return createPortal(
      <div
        ref={ref}
        className={cn(toastContainerVariants({ position }), className)}
        {...props}
      >
        {children}
      </div>,
      document.body
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

// Toast context for programmatic usage
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast provider props
 */
export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

/**
 * ToastProvider component
 *
 * Provides toast functionality to the application.
 *
 * @example
 * ```tsx
 * import { ToastProvider, useToast } from '@tpmjs/ui/Toast/Toast';
 *
 * function App() {
 *   return (
 *     <ToastProvider position="bottom-right">
 *       <MyComponent />
 *     </ToastProvider>
 *   );
 * }
 *
 * function MyComponent() {
 *   const { toast, dismiss } = useToast();
 *
 *   return (
 *     <button onClick={() => toast({ title: 'Hello', variant: 'success' })}>
 *       Show Toast
 *     </button>
 *   );
 * }
 * ```
 */
export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback(
    (props: Omit<ToastProps, 'open' | 'onClose'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newToast: ToastState = {
        ...props,
        id,
        open: true,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Remove oldest toasts if exceeding max
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [maxToasts]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t))
    );
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, open: false })));
    setTimeout(() => {
      setToasts([]);
    }, 200);
  }, []);

  const contextValue = useMemo(
    () => ({
      toast,
      dismiss,
      dismissAll,
    }),
    [toast, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            open={t.open}
            onClose={() => dismiss(t.id)}
            title={t.title}
            description={t.description}
            variant={t.variant}
            action={t.action}
            duration={t.duration}
            showCloseButton={t.showCloseButton}
            icon={t.icon}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

/**
 * useToast hook
 *
 * Hook to access toast functionality from ToastProvider.
 *
 * @example
 * ```tsx
 * const { toast, dismiss, dismissAll } = useToast();
 *
 * // Show a success toast
 * const id = toast({
 *   title: 'Success',
 *   description: 'Your changes have been saved.',
 *   variant: 'success',
 * });
 *
 * // Dismiss a specific toast
 * dismiss(id);
 *
 * // Dismiss all toasts
 * dismissAll();
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

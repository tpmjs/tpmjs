'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon/Icon';
import type {
  DrawerBodyProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
} from './types';
import {
  drawerBackdropVariants,
  drawerBodyVariants,
  drawerCloseButtonVariants,
  drawerContainerVariants,
  drawerFooterVariants,
  drawerHeaderVariants,
  drawerPanelVariants,
  drawerTitleVariants,
} from './variants';

/**
 * Drawer component
 *
 * A slide-out panel overlay with focus trap, keyboard support, and accessibility features.
 *
 * @example
 * ```tsx
 * import { Drawer } from '@tpmjs/ui/Drawer/Drawer';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Open Drawer</Button>
 *       <Drawer
 *         open={open}
 *         onClose={() => setOpen(false)}
 *         title="Settings"
 *         side="right"
 *         footer={
 *           <>
 *             <Button variant="outline" onClick={() => setOpen(false)}>
 *               Cancel
 *             </Button>
 *             <Button onClick={() => setOpen(false)}>
 *               Save
 *             </Button>
 *           </>
 *         }
 *       >
 *         <p>Drawer content goes here.</p>
 *       </Drawer>
 *     </>
 *   );
 * }
 * ```
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      side = 'right',
      size = 'md',
      closeOnBackdropClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      footer,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Handle escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, onClose]);

    // Handle focus trap
    useEffect(() => {
      if (!open) return;

      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the panel
      const timer = setTimeout(() => {
        panelRef.current?.focus();
      }, 0);

      // Prevent body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;

        // Restore focus to the previously focused element
        previousActiveElement.current?.focus();
      };
    }, [open]);

    // Handle backdrop click
    const handleBackdropClick = useCallback(
      (event: React.MouseEvent) => {
        if (closeOnBackdropClick && event.target === event.currentTarget) {
          onClose();
        }
      },
      [closeOnBackdropClick, onClose]
    );

    // Handle focus trap within drawer
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        const panel = panelRef.current;
        if (!panel) return;

        const focusableElements = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      },
      []
    );

    if (!open) return null;

    // Only render in browser (for SSR compatibility)
    if (typeof window === 'undefined') return null;

    const drawerContent = (
      <>
        {/* Backdrop */}
        <div
          className={drawerBackdropVariants({ state: 'entered' })}
          aria-hidden="true"
          onClick={handleBackdropClick}
        />

        {/* Container */}
        <div
          className={drawerContainerVariants({})}
          onKeyDown={handleKeyDown}
        >
          {/* Panel */}
          <div
            ref={(node) => {
              // Handle both refs
              (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              drawerPanelVariants({ side, size, state: 'entered' }),
              className
            )}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={drawerHeaderVariants({})}>
                {title && (
                  <h2 id={titleId} className={drawerTitleVariants({})}>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={drawerCloseButtonVariants({})}
                    aria-label="Close drawer"
                  >
                    <Icon icon="x" size="sm" />
                  </button>
                )}
              </div>
            )}

            {/* Hidden description for screen readers */}
            {description && (
              <p id={descriptionId} className="sr-only">
                {description}
              </p>
            )}

            {/* Body */}
            <div className={drawerBodyVariants({})}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className={drawerFooterVariants({})}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </>
    );

    return createPortal(drawerContent, document.body);
  }
);

Drawer.displayName = 'Drawer';

/**
 * DrawerHeader component for custom headers
 */
export const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(drawerHeaderVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

DrawerHeader.displayName = 'DrawerHeader';

/**
 * DrawerBody component for custom body content
 */
export const DrawerBody = forwardRef<HTMLDivElement, DrawerBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(drawerBodyVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

DrawerBody.displayName = 'DrawerBody';

/**
 * DrawerFooter component for custom footers
 */
export const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(drawerFooterVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

DrawerFooter.displayName = 'DrawerFooter';

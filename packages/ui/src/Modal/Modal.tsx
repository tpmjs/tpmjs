'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon/Icon';
import type {
  ModalBodyProps,
  ModalFooterProps,
  ModalHeaderProps,
  ModalProps,
} from './types';
import {
  modalBackdropVariants,
  modalBodyVariants,
  modalCloseButtonVariants,
  modalContainerVariants,
  modalFooterVariants,
  modalHeaderVariants,
  modalPanelVariants,
  modalTitleVariants,
} from './variants';

/**
 * Modal component
 *
 * A dialog overlay with focus trap, keyboard support, and accessibility features.
 *
 * @example
 * ```tsx
 * import { Modal } from '@tpmjs/ui/Modal/Modal';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Open Modal</Button>
 *       <Modal
 *         open={open}
 *         onClose={() => setOpen(false)}
 *         title="Confirm Action"
 *         footer={
 *           <>
 *             <Button variant="outline" onClick={() => setOpen(false)}>
 *               Cancel
 *             </Button>
 *             <Button onClick={() => setOpen(false)}>
 *               Confirm
 *             </Button>
 *           </>
 *         }
 *       >
 *         <p>Are you sure you want to proceed?</p>
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      description,
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

    // Handle focus trap within modal
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

    const modalContent = (
      <>
        {/* Backdrop */}
        <div
          className={modalBackdropVariants({ state: 'entered' })}
          aria-hidden="true"
        />

        {/* Container */}
        <div
          className={modalContainerVariants({})}
          onClick={handleBackdropClick}
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
              modalPanelVariants({ size, state: 'entered' }),
              className
            )}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={modalHeaderVariants({})}>
                {title && (
                  <h2 id={titleId} className={modalTitleVariants({})}>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={modalCloseButtonVariants({})}
                    aria-label="Close modal"
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
            <div className={modalBodyVariants({})}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className={modalFooterVariants({})}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </>
    );

    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

/**
 * ModalHeader component for custom headers
 */
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(modalHeaderVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

ModalHeader.displayName = 'ModalHeader';

/**
 * ModalBody component for custom body content
 */
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(modalBodyVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

ModalBody.displayName = 'ModalBody';

/**
 * ModalFooter component for custom footers
 */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(modalFooterVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

ModalFooter.displayName = 'ModalFooter';

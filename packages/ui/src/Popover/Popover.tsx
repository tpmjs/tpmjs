'use client';

import { cn } from '@tpmjs/utils/cn';
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { PopoverPlacement, PopoverProps } from './types';
import {
  popoverArrowVariants,
  popoverBodyVariants,
  popoverContentVariants,
} from './variants';

/**
 * Calculate position based on trigger and placement
 */
function calculatePosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  placement: PopoverPlacement,
  offset: number
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  switch (placement) {
    case 'top':
      top = triggerRect.top + scrollY - contentRect.height - offset;
      left = triggerRect.left + scrollX + (triggerRect.width - contentRect.width) / 2;
      break;
    case 'top-start':
      top = triggerRect.top + scrollY - contentRect.height - offset;
      left = triggerRect.left + scrollX;
      break;
    case 'top-end':
      top = triggerRect.top + scrollY - contentRect.height - offset;
      left = triggerRect.right + scrollX - contentRect.width;
      break;
    case 'bottom':
      top = triggerRect.bottom + scrollY + offset;
      left = triggerRect.left + scrollX + (triggerRect.width - contentRect.width) / 2;
      break;
    case 'bottom-start':
      top = triggerRect.bottom + scrollY + offset;
      left = triggerRect.left + scrollX;
      break;
    case 'bottom-end':
      top = triggerRect.bottom + scrollY + offset;
      left = triggerRect.right + scrollX - contentRect.width;
      break;
    case 'left':
      top = triggerRect.top + scrollY + (triggerRect.height - contentRect.height) / 2;
      left = triggerRect.left + scrollX - contentRect.width - offset;
      break;
    case 'left-start':
      top = triggerRect.top + scrollY;
      left = triggerRect.left + scrollX - contentRect.width - offset;
      break;
    case 'left-end':
      top = triggerRect.bottom + scrollY - contentRect.height;
      left = triggerRect.left + scrollX - contentRect.width - offset;
      break;
    case 'right':
      top = triggerRect.top + scrollY + (triggerRect.height - contentRect.height) / 2;
      left = triggerRect.right + scrollX + offset;
      break;
    case 'right-start':
      top = triggerRect.top + scrollY;
      left = triggerRect.right + scrollX + offset;
      break;
    case 'right-end':
      top = triggerRect.bottom + scrollY - contentRect.height;
      left = triggerRect.right + scrollX + offset;
      break;
  }

  return { top, left };
}

/**
 * Popover component
 *
 * A floating content panel that appears next to a trigger element.
 *
 * @example
 * ```tsx
 * import { Popover } from '@tpmjs/ui/Popover/Popover';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   return (
 *     <Popover
 *       content={<p>This is popover content</p>}
 *       placement="bottom"
 *     >
 *       <Button>Click me</Button>
 *     </Popover>
 *   );
 * }
 * ```
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      open: controlledOpen,
      onOpenChange,
      defaultOpen = false,
      children,
      content,
      placement = 'bottom',
      trigger = 'click',
      offset = 8,
      closeOnClickOutside = true,
      closeOnEscape = true,
      showDelay = 0,
      hideDelay = 0,
      hasArrow = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const triggerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const [position, setPosition] = useState({ top: 0, left: 0 });

    const setOpen = useCallback(
      (value: boolean) => {
        if (!isControlled) {
          setInternalOpen(value);
        }
        onOpenChange?.(value);
      },
      [isControlled, onOpenChange]
    );

    const handleOpen = useCallback(() => {
      if (disabled) return;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      if (showDelay > 0) {
        showTimeoutRef.current = setTimeout(() => {
          setOpen(true);
        }, showDelay);
      } else {
        setOpen(true);
      }
    }, [disabled, showDelay, setOpen]);

    const handleClose = useCallback(() => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }

      if (hideDelay > 0) {
        hideTimeoutRef.current = setTimeout(() => {
          setOpen(false);
        }, hideDelay);
      } else {
        setOpen(false);
      }
    }, [hideDelay, setOpen]);

    const handleToggle = useCallback(() => {
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    }, [isOpen, handleOpen, handleClose]);

    // Update position when open
    useEffect(() => {
      if (!isOpen || !triggerRef.current || !contentRef.current) return;

      const updatePosition = () => {
        const triggerRect = triggerRef.current!.getBoundingClientRect();
        const contentRect = contentRef.current!.getBoundingClientRect();
        const newPosition = calculatePosition(triggerRect, contentRect, placement, offset);
        setPosition(newPosition);
      };

      updatePosition();

      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [isOpen, placement, offset]);

    // Handle click outside
    useEffect(() => {
      if (!isOpen || !closeOnClickOutside) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          triggerRef.current?.contains(target) ||
          contentRef.current?.contains(target)
        ) {
          return;
        }
        handleClose();
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeOnClickOutside, handleClose]);

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          handleClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, handleClose]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      };
    }, []);

    // Clone trigger element with event handlers
    const triggerElement = isValidElement(children)
      ? cloneElement(children as React.ReactElement<any>, {
          ref: triggerRef,
          ...(trigger === 'click' && {
            onClick: (e: React.MouseEvent) => {
              (children as React.ReactElement<any>).props.onClick?.(e);
              handleToggle();
            },
          }),
          ...(trigger === 'hover' && {
            onMouseEnter: (e: React.MouseEvent) => {
              (children as React.ReactElement<any>).props.onMouseEnter?.(e);
              handleOpen();
            },
            onMouseLeave: (e: React.MouseEvent) => {
              (children as React.ReactElement<any>).props.onMouseLeave?.(e);
              handleClose();
            },
          }),
          ...(trigger === 'focus' && {
            onFocus: (e: React.FocusEvent) => {
              (children as React.ReactElement<any>).props.onFocus?.(e);
              handleOpen();
            },
            onBlur: (e: React.FocusEvent) => {
              (children as React.ReactElement<any>).props.onBlur?.(e);
              handleClose();
            },
          }),
        })
      : children;

    // Only render portal in browser
    const canRenderPortal = typeof window !== 'undefined';

    return (
      <>
        {triggerElement}
        {canRenderPortal &&
          isOpen &&
          createPortal(
            <div
              ref={(node) => {
                (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              role="dialog"
              aria-modal="false"
              className={cn(popoverContentVariants({ state: 'entered' }), className)}
              style={{
                top: position.top,
                left: position.left,
              }}
              onMouseEnter={trigger === 'hover' ? handleOpen : undefined}
              onMouseLeave={trigger === 'hover' ? handleClose : undefined}
              {...props}
            >
              {hasArrow && (
                <div className={popoverArrowVariants({ placement })} />
              )}
              <div className={popoverBodyVariants({})}>
                {content}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
);

Popover.displayName = 'Popover';

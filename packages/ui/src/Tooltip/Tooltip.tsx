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
import type { TooltipPlacement, TooltipProps } from './types';
import { tooltipArrowVariants, tooltipContentVariants } from './variants';

/**
 * Calculate position based on trigger and placement
 */
function calculatePosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  placement: TooltipPlacement,
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
 * Tooltip component
 *
 * A lightweight floating label that appears on hover/focus.
 *
 * @example
 * ```tsx
 * import { Tooltip } from '@tpmjs/ui/Tooltip/Tooltip';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   return (
 *     <Tooltip content="This is a helpful tip">
 *       <Button>Hover me</Button>
 *     </Tooltip>
 *   );
 * }
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      placement = 'top',
      offset = 6,
      showDelay = 200,
      hideDelay = 0,
      hasArrow = true,
      disabled = false,
      open: controlledOpen,
      onOpenChange,
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
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
          onMouseEnter: (e: React.MouseEvent) => {
            (children as React.ReactElement<any>).props.onMouseEnter?.(e);
            handleOpen();
          },
          onMouseLeave: (e: React.MouseEvent) => {
            (children as React.ReactElement<any>).props.onMouseLeave?.(e);
            handleClose();
          },
          onFocus: (e: React.FocusEvent) => {
            (children as React.ReactElement<any>).props.onFocus?.(e);
            handleOpen();
          },
          onBlur: (e: React.FocusEvent) => {
            (children as React.ReactElement<any>).props.onBlur?.(e);
            handleClose();
          },
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
              role="tooltip"
              className={cn(tooltipContentVariants({ state: 'entered' }), className)}
              style={{
                top: position.top,
                left: position.left,
              }}
              {...props}
            >
              {hasArrow && (
                <div className={tooltipArrowVariants({ placement })} />
              )}
              {content}
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

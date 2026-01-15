'use client';

import { cn } from '@tpmjs/utils/cn';
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  DropdownMenuGroupProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuPlacement,
  DropdownMenuProps,
  DropdownMenuSeparatorProps,
} from './types';
import {
  dropdownMenuContentVariants,
  dropdownMenuItemIconVariants,
  dropdownMenuItemShortcutVariants,
  dropdownMenuItemVariants,
  dropdownMenuLabelVariants,
  dropdownMenuSeparatorVariants,
} from './variants';

// Context for menu state
interface DropdownMenuContextValue {
  closeMenu: () => void;
  closeOnSelect: boolean;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  registerItem: () => number;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

/**
 * Calculate position based on trigger and placement
 */
function calculatePosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  placement: DropdownMenuPlacement,
  offset: number
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  switch (placement) {
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
  }

  return { top, left };
}

/**
 * DropdownMenu component
 *
 * A menu that appears when clicking a trigger element.
 *
 * @example
 * ```tsx
 * import {
 *   DropdownMenu,
 *   DropdownMenuItem,
 *   DropdownMenuSeparator,
 * } from '@tpmjs/ui/DropdownMenu/DropdownMenu';
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   return (
 *     <DropdownMenu trigger={<Button>Open Menu</Button>}>
 *       <DropdownMenuItem onSelect={() => console.log('Edit')}>
 *         Edit
 *       </DropdownMenuItem>
 *       <DropdownMenuItem onSelect={() => console.log('Duplicate')}>
 *         Duplicate
 *       </DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem destructive onSelect={() => console.log('Delete')}>
 *         Delete
 *       </DropdownMenuItem>
 *     </DropdownMenu>
 *   );
 * }
 * ```
 */
export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      open: controlledOpen,
      onOpenChange,
      defaultOpen = false,
      trigger,
      placement = 'bottom-start',
      offset = 4,
      closeOnClickOutside = true,
      closeOnEscape = true,
      closeOnSelect = true,
      children,
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
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [activeIndex, setActiveIndex] = useState(-1);
    const itemCountRef = useRef(0);

    const setOpen = useCallback(
      (value: boolean) => {
        if (!isControlled) {
          setInternalOpen(value);
        }
        onOpenChange?.(value);
        if (!value) {
          setActiveIndex(-1);
        }
      },
      [isControlled, onOpenChange]
    );

    const handleToggle = useCallback(() => {
      setOpen(!isOpen);
    }, [isOpen, setOpen]);

    const closeMenu = useCallback(() => {
      setOpen(false);
    }, [setOpen]);

    const registerItem = useCallback(() => {
      const index = itemCountRef.current;
      itemCountRef.current += 1;
      return index;
    }, []);

    // Reset item count when menu closes
    useEffect(() => {
      if (!isOpen) {
        itemCountRef.current = 0;
      }
    }, [isOpen]);

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
        closeMenu();
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeOnClickOutside, closeMenu]);

    // Handle escape key and keyboard navigation
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case 'Escape':
            if (closeOnEscape) {
              event.preventDefault();
              closeMenu();
            }
            break;
          case 'ArrowDown':
            event.preventDefault();
            setActiveIndex((prev) =>
              prev < itemCountRef.current - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setActiveIndex((prev) =>
              prev > 0 ? prev - 1 : itemCountRef.current - 1
            );
            break;
          case 'Home':
            event.preventDefault();
            setActiveIndex(0);
            break;
          case 'End':
            event.preventDefault();
            setActiveIndex(itemCountRef.current - 1);
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, closeMenu]);

    // Clone trigger element with click handler
    const triggerElement = isValidElement(trigger)
      ? cloneElement(trigger as React.ReactElement<any>, {
          ref: triggerRef,
          onClick: (e: React.MouseEvent) => {
            (trigger as React.ReactElement<any>).props.onClick?.(e);
            handleToggle();
          },
          'aria-haspopup': 'menu',
          'aria-expanded': isOpen,
        })
      : trigger;

    const contextValue = useMemo(
      () => ({
        closeMenu,
        closeOnSelect,
        activeIndex,
        setActiveIndex,
        registerItem,
      }),
      [closeMenu, closeOnSelect, activeIndex, registerItem]
    );

    // Only render portal in browser
    const canRenderPortal = typeof window !== 'undefined';

    return (
      <DropdownMenuContext.Provider value={contextValue}>
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
              role="menu"
              aria-orientation="vertical"
              className={cn(dropdownMenuContentVariants({ state: 'entered' }), className)}
              style={{
                top: position.top,
                left: position.left,
              }}
              {...props}
            >
              {children}
            </div>,
            document.body
          )}
      </DropdownMenuContext.Provider>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

/**
 * DropdownMenuItem component
 */
export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  (
    {
      disabled = false,
      destructive = false,
      icon,
      shortcut,
      onSelect,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const context = useContext(DropdownMenuContext);
    const indexRef = useRef<number>(-1);

    // Register this item and get its index
    useEffect(() => {
      if (context && indexRef.current === -1) {
        indexRef.current = context.registerItem();
      }
    }, [context]);

    const isActive = context?.activeIndex === indexRef.current;

    const handleClick = useCallback(() => {
      if (disabled) return;
      onSelect?.();
      if (context?.closeOnSelect) {
        context.closeMenu();
      }
    }, [disabled, onSelect, context]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        tabIndex={isActive ? 0 : -1}
        className={cn(
          dropdownMenuItemVariants({
            disabled: disabled ? 'true' : 'false',
            destructive: destructive ? 'true' : 'false',
            active: isActive ? 'true' : 'false',
          }),
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => context?.setActiveIndex(indexRef.current)}
        {...props}
      >
        {icon && (
          <span className={dropdownMenuItemIconVariants({ destructive: destructive ? 'true' : 'false' })}>
            {icon}
          </span>
        )}
        <span className="flex-1">{children}</span>
        {shortcut && (
          <span className={dropdownMenuItemShortcutVariants({})}>
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);

DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * DropdownMenuSeparator component
 */
export const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn(dropdownMenuSeparatorVariants({}), className)}
      {...props}
    />
  )
);

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

/**
 * DropdownMenuLabel component
 */
export const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(dropdownMenuLabelVariants({}), className)}
      {...props}
    >
      {children}
    </div>
  )
);

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

/**
 * DropdownMenuGroup component
 */
export const DropdownMenuGroup = forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ label, children, className, ...props }, ref) => (
    <div ref={ref} role="group" className={className} {...props}>
      {label && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
      {children}
    </div>
  )
);

DropdownMenuGroup.displayName = 'DropdownMenuGroup';

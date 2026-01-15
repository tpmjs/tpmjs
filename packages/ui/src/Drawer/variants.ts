import { createVariants } from '../system/variants';

/**
 * Drawer backdrop variant definitions
 */
export const drawerBackdropVariants = createVariants({
  base: [
    'fixed inset-0',
    'bg-foreground/80',
    'backdrop-blur-sm',
    'z-[var(--z-drawer)]',
    'transition-opacity duration-200',
  ].join(' '),

  variants: {
    state: {
      entering: 'opacity-0',
      entered: 'opacity-100',
      exiting: 'opacity-0',
    },
  },

  defaultVariants: {
    state: 'entered',
  },
});

/**
 * Drawer container variant definitions
 */
export const drawerContainerVariants = createVariants({
  base: [
    'fixed inset-0',
    'z-[var(--z-drawer)]',
    'overflow-hidden',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Drawer panel variant definitions
 */
export const drawerPanelVariants = createVariants({
  base: [
    // Layout
    'fixed',
    'flex flex-col',
    // Styling - Sharp corners, blueprint aesthetic
    'bg-surface border-border',
    // Shadow
    'shadow-xl',
    // Animation
    'transition-transform duration-200 ease-out',
  ].join(' '),

  variants: {
    side: {
      left: 'inset-y-0 left-0 border-r',
      right: 'inset-y-0 right-0 border-l',
      top: 'inset-x-0 top-0 border-b',
      bottom: 'inset-x-0 bottom-0 border-t',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
      full: '',
    },
    state: {
      entering: '',
      entered: 'translate-x-0 translate-y-0',
      exiting: '',
    },
  },

  defaultVariants: {
    side: 'right',
    size: 'md',
    state: 'entered',
  },

  compoundVariants: [
    // Size + Side combinations for horizontal drawers (left/right)
    { conditions: { side: 'left', size: 'sm' }, className: 'w-64 max-w-[80vw]' },
    { conditions: { side: 'left', size: 'md' }, className: 'w-80 max-w-[80vw]' },
    { conditions: { side: 'left', size: 'lg' }, className: 'w-96 max-w-[80vw]' },
    { conditions: { side: 'left', size: 'xl' }, className: 'w-[32rem] max-w-[80vw]' },
    { conditions: { side: 'left', size: 'full' }, className: 'w-screen' },
    { conditions: { side: 'right', size: 'sm' }, className: 'w-64 max-w-[80vw]' },
    { conditions: { side: 'right', size: 'md' }, className: 'w-80 max-w-[80vw]' },
    { conditions: { side: 'right', size: 'lg' }, className: 'w-96 max-w-[80vw]' },
    { conditions: { side: 'right', size: 'xl' }, className: 'w-[32rem] max-w-[80vw]' },
    { conditions: { side: 'right', size: 'full' }, className: 'w-screen' },

    // Size + Side combinations for vertical drawers (top/bottom)
    { conditions: { side: 'top', size: 'sm' }, className: 'h-48 max-h-[50vh]' },
    { conditions: { side: 'top', size: 'md' }, className: 'h-64 max-h-[50vh]' },
    { conditions: { side: 'top', size: 'lg' }, className: 'h-80 max-h-[50vh]' },
    { conditions: { side: 'top', size: 'xl' }, className: 'h-96 max-h-[50vh]' },
    { conditions: { side: 'top', size: 'full' }, className: 'h-screen' },
    { conditions: { side: 'bottom', size: 'sm' }, className: 'h-48 max-h-[50vh]' },
    { conditions: { side: 'bottom', size: 'md' }, className: 'h-64 max-h-[50vh]' },
    { conditions: { side: 'bottom', size: 'lg' }, className: 'h-80 max-h-[50vh]' },
    { conditions: { side: 'bottom', size: 'xl' }, className: 'h-96 max-h-[50vh]' },
    { conditions: { side: 'bottom', size: 'full' }, className: 'h-screen' },

    // State + Side combinations for enter/exit transforms
    { conditions: { side: 'left', state: 'entering' }, className: '-translate-x-full' },
    { conditions: { side: 'left', state: 'exiting' }, className: '-translate-x-full' },
    { conditions: { side: 'right', state: 'entering' }, className: 'translate-x-full' },
    { conditions: { side: 'right', state: 'exiting' }, className: 'translate-x-full' },
    { conditions: { side: 'top', state: 'entering' }, className: '-translate-y-full' },
    { conditions: { side: 'top', state: 'exiting' }, className: '-translate-y-full' },
    { conditions: { side: 'bottom', state: 'entering' }, className: 'translate-y-full' },
    { conditions: { side: 'bottom', state: 'exiting' }, className: 'translate-y-full' },
  ],
});

/**
 * Drawer header variant definitions
 */
export const drawerHeaderVariants = createVariants({
  base: [
    'flex items-center justify-between',
    'px-6 py-4',
    'border-b border-border',
    'bg-surface',
    'flex-shrink-0',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Drawer body variant definitions
 */
export const drawerBodyVariants = createVariants({
  base: [
    'flex-1',
    'px-6 py-4',
    'overflow-y-auto',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Drawer footer variant definitions
 */
export const drawerFooterVariants = createVariants({
  base: [
    'flex items-center justify-end gap-3',
    'px-6 py-4',
    'border-t border-border',
    'bg-surface',
    'flex-shrink-0',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Drawer title variant definitions
 */
export const drawerTitleVariants = createVariants({
  base: [
    'font-mono font-semibold text-lg',
    'text-foreground',
    'lowercase',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Drawer close button variant definitions
 */
export const drawerCloseButtonVariants = createVariants({
  base: [
    'p-2 -m-2',
    'text-foreground-muted',
    'hover:text-foreground hover:bg-accent/10',
    'transition-colors duration-150',
    'rounded-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

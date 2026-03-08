import { createVariants } from '../system/variants';

export const dividerVariants = createVariants({
  base: 'shrink-0 border-border',

  variants: {
    orientation: {
      horizontal: 'w-full border-t',
      vertical: 'h-full border-l self-stretch',
    },
    variant: {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    },
    thickness: {
      thin: '',
      medium: '',
      thick: '',
    },
    spacing: {
      none: '',
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
  },

  compoundVariants: [
    // Horizontal spacing
    { conditions: { orientation: 'horizontal', spacing: 'sm' }, className: 'my-2' },
    { conditions: { orientation: 'horizontal', spacing: 'md' }, className: 'my-4' },
    { conditions: { orientation: 'horizontal', spacing: 'lg' }, className: 'my-6' },
    { conditions: { orientation: 'horizontal', spacing: 'xl' }, className: 'my-8' },
    // Vertical spacing
    { conditions: { orientation: 'vertical', spacing: 'sm' }, className: 'mx-2' },
    { conditions: { orientation: 'vertical', spacing: 'md' }, className: 'mx-4' },
    { conditions: { orientation: 'vertical', spacing: 'lg' }, className: 'mx-6' },
    { conditions: { orientation: 'vertical', spacing: 'xl' }, className: 'mx-8' },
    // Horizontal thickness
    {
      conditions: { orientation: 'horizontal', thickness: 'thin' },
      className: 'border-t',
    },
    {
      conditions: { orientation: 'horizontal', thickness: 'medium' },
      className: 'border-t-2',
    },
    {
      conditions: { orientation: 'horizontal', thickness: 'thick' },
      className: 'border-t-4',
    },
    // Vertical thickness
    {
      conditions: { orientation: 'vertical', thickness: 'thin' },
      className: 'border-l',
    },
    {
      conditions: { orientation: 'vertical', thickness: 'medium' },
      className: 'border-l-2',
    },
    {
      conditions: { orientation: 'vertical', thickness: 'thick' },
      className: 'border-l-4',
    },
  ],

  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
    thickness: 'thin',
    spacing: 'md',
  },
});

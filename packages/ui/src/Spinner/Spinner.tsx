'use client';

import { cn } from '@tpmjs/utils/cn';

const sizeClasses = {
  xs: 'w-5 h-5',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
} as const;

const dotSizeClasses = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant */
  size?: keyof typeof sizeClasses;
  /** Optional label for accessibility */
  label?: string;
}

/**
 * Spinner component
 *
 * An elegant orbital loading spinner with three dots rotating
 * in a synchronized dance pattern.
 */
export function Spinner({
  className,
  size = 'md',
  label = 'Loading...',
  ...props
}: SpinnerProps): React.ReactElement {
  const sizeClass = sizeClasses[size];
  const dotSize = dotSizeClasses[size];

  return (
    // biome-ignore lint/a11y/useSemanticElements: Spinner requires role="status" for screen reader announcements, <output> is not semantically appropriate
    <div
      role="status"
      aria-label={label}
      className={cn('relative', sizeClass, className)}
      {...props}
    >
      <style>
        {`
          @keyframes spinnerOrbit {
            0% {
              transform: rotate(0deg) translateX(140%) rotate(0deg);
            }
            100% {
              transform: rotate(360deg) translateX(140%) rotate(-360deg);
            }
          }
        `}
      </style>

      {/* Orbital ring hint */}
      <div className="absolute inset-[15%] rounded-full border border-foreground/10" />

      {/* Three orbiting dots with staggered animations */}
      <div
        className={cn('absolute rounded-full bg-foreground', dotSize)}
        style={{
          top: '50%',
          left: '50%',
          marginTop: '-0.25rem',
          marginLeft: '-0.25rem',
          animation: 'spinnerOrbit 1.4s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        }}
      />
      <div
        className={cn('absolute rounded-full bg-foreground/50', dotSize)}
        style={{
          top: '50%',
          left: '50%',
          marginTop: '-0.25rem',
          marginLeft: '-0.25rem',
          animation: 'spinnerOrbit 1.4s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          animationDelay: '-0.45s',
        }}
      />
      <div
        className={cn('absolute rounded-full bg-foreground/25', dotSize)}
        style={{
          top: '50%',
          left: '50%',
          marginTop: '-0.25rem',
          marginLeft: '-0.25rem',
          animation: 'spinnerOrbit 1.4s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          animationDelay: '-0.9s',
        }}
      />

      {/* Screen reader text */}
      <span className="sr-only">{label}</span>
    </div>
  );
}

Spinner.displayName = 'Spinner';

'use client';

import { cn } from '@tpmjs/utils/cn';

const sizeConfig = {
  xs: { container: 'w-4 h-4', block: 3, gap: 1 },
  sm: { container: 'w-6 h-6', block: 4, gap: 2 },
  md: { container: 'w-8 h-8', block: 6, gap: 2 },
  lg: { container: 'w-12 h-12', block: 8, gap: 3 },
  xl: { container: 'w-16 h-16', block: 12, gap: 4 },
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant */
  size?: keyof typeof sizeConfig;
  /** Optional label for accessibility */
  label?: string;
}

/**
 * Spinner component
 *
 * A brutalist grid-based loader that evokes the feeling of
 * tools being constructed, block by block. Matches the TPMJS
 * dithering aesthetic with sharp squares and wave animations.
 */
export function Spinner({
  className,
  size = 'md',
  label = 'Loading...',
  ...props
}: SpinnerProps): React.ReactElement {
  const config = sizeConfig[size];
  const blockSize = config.block;
  const gap = config.gap;

  // 3x3 grid positions with staggered delays (diagonal wave)
  const blocks = [
    { id: 'b00', row: 0, col: 0, delay: 0 },
    { id: 'b01', row: 0, col: 1, delay: 0.1 },
    { id: 'b02', row: 0, col: 2, delay: 0.2 },
    { id: 'b10', row: 1, col: 0, delay: 0.1 },
    { id: 'b11', row: 1, col: 1, delay: 0.2 },
    { id: 'b12', row: 1, col: 2, delay: 0.3 },
    { id: 'b20', row: 2, col: 0, delay: 0.2 },
    { id: 'b21', row: 2, col: 1, delay: 0.3 },
    { id: 'b22', row: 2, col: 2, delay: 0.4 },
  ];

  return (
    // biome-ignore lint/a11y/useSemanticElements: Spinner requires role="status" for screen reader announcements
    <div
      role="status"
      aria-label={label}
      className={cn(
        'relative inline-flex items-center justify-center',
        config.container,
        className
      )}
      {...props}
    >
      <style>
        {`
          @keyframes blockPulse {
            0%, 100% {
              opacity: 0.15;
              transform: scale(0.85);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>

      <div
        className="relative"
        style={{
          width: blockSize * 3 + gap * 2,
          height: blockSize * 3 + gap * 2,
        }}
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            className="absolute bg-foreground"
            style={{
              width: blockSize,
              height: blockSize,
              left: block.col * (blockSize + gap),
              top: block.row * (blockSize + gap),
              animation: 'blockPulse 1.2s ease-in-out infinite',
              animationDelay: `${block.delay}s`,
            }}
          />
        ))}
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}

Spinner.displayName = 'Spinner';

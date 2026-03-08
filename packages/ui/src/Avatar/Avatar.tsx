'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useState } from 'react';
import type { AvatarProps } from './types';
import { avatarVariants } from './variants';

/**
 * Avatar component
 * Displays a user avatar image, initials fallback, or generic user icon
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', shape = 'square', ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
      <div ref={ref} className={cn(avatarVariants({ size, shape }), className)} {...props}>
        {showImage ? (
          <img
            src={src}
            alt={alt || ''}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : fallback ? (
          <span aria-hidden="true">{fallback.slice(0, 2).toUpperCase()}</span>
        ) : (
          <svg
            className="h-[60%] w-[60%]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

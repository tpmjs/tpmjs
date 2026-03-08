import type { ComponentPropsWithoutRef } from 'react';

export interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text (first 2 characters used as initials) */
  fallback?: string;
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Avatar shape */
  shape?: 'square' | 'rounded' | 'circle';
}

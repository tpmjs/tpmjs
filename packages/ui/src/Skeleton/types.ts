import type { HTMLAttributes } from 'react';

/**
 * Skeleton variant types
 */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

/**
 * Skeleton animation types
 */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Skeleton component props
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Shape variant
   * @default 'text'
   */
  variant?: SkeletonVariant;

  /**
   * Animation type
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;

  /**
   * Width (CSS value)
   */
  width?: string | number;

  /**
   * Height (CSS value)
   */
  height?: string | number;

  /**
   * Number of skeleton lines (for text variant)
   * @default 1
   */
  lines?: number;

  /**
   * Gap between lines (for text variant)
   * @default '0.5rem'
   */
  gap?: string | number;

  /**
   * Whether the last line should be shorter (for text variant)
   * @default false
   */
  lastLineShort?: boolean;
}

/**
 * SkeletonText component props
 */
export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of lines
   * @default 3
   */
  lines?: number;

  /**
   * Gap between lines
   * @default '0.5rem'
   */
  gap?: string | number;

  /**
   * Width of each line (can be string, number, or array)
   */
  width?: string | number | (string | number)[];

  /**
   * Animation type
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;
}

/**
 * SkeletonAvatar component props
 */
export interface SkeletonAvatarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the avatar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Animation type
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;
}

/**
 * SkeletonCard component props
 */
export interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show an image placeholder
   * @default true
   */
  showImage?: boolean;

  /**
   * Number of text lines
   * @default 3
   */
  lines?: number;

  /**
   * Animation type
   * @default 'pulse'
   */
  animation?: SkeletonAnimation;
}

/**
 * Skeleton ref type
 */
export type SkeletonRef = HTMLDivElement;

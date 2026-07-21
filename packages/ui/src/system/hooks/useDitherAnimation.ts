/**
 * useDitherAnimation Hook
 *
 * Manages RAF-based frame playback for dither animations.
 * Handles reveal (one-shot) and pulse (looping) animation modes.
 */

import { useEffect, useRef, useState } from 'react';

export interface DitherAnimationOptions {
  /** Pre-computed animation frames */
  frames: ImageData[];
  /** Animation mode */
  mode: 'reveal' | 'pulse' | 'static';
  /** Animation duration in milliseconds */
  speed?: number;
  /** Delay before starting animation (ms) */
  delay?: number;
  /** Called when animation completes (reveal mode only) */
  onComplete?: () => void;
  /** Pause animation (for intersection observer) */
  paused?: boolean;
}

export interface DitherAnimationState {
  /** Current frame ImageData */
  currentFrame: ImageData | null;
  /** Whether animation is complete */
  isComplete: boolean;
  /** Current frame index */
  frameIndex: number;
}

/**
 * Hook for managing dither animation playback
 */
export function useDitherAnimation(options: DitherAnimationOptions): DitherAnimationState {
  const { frames, mode, speed = 2000, delay = 0, onComplete, paused = false } = options;

  const [currentFrame, setCurrentFrame] = useState<ImageData | null>(
    mode === 'static' ? frames[frames.length - 1] || null : null
  );
  const [isComplete, setIsComplete] = useState(mode === 'static');
  const [frameIndex, setFrameIndex] = useState(0);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't animate if static mode or paused
    if (mode === 'static' || paused || frames.length === 0) {
      return;
    }

    let animationStartTime: number | null = null;

    const animate = (timestamp: number) => {
      // Initialize start time
      if (animationStartTime === null) {
        animationStartTime = timestamp + delay;
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Wait for delay
      if (timestamp < animationStartTime) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate progress
      const elapsed = timestamp - animationStartTime;
      const progress = Math.min(elapsed / speed, 1);

      if (mode === 'reveal') {
        // Reveal: play once from start to end
        const index = Math.floor(progress * (frames.length - 1));
        const frame = frames[index];
        if (frame) {
          setCurrentFrame(frame);
          setFrameIndex(index);
        }

        if (progress >= 1) {
          // Animation complete
          const lastFrame = frames[frames.length - 1];
          if (lastFrame) {
            setCurrentFrame(lastFrame);
          }
          setFrameIndex(frames.length - 1);
          setIsComplete(true);
          onComplete?.();
          return;
        }
      } else if (mode === 'pulse') {
        // Pulse: loop continuously
        const loopProgress = (elapsed % speed) / speed;
        const index = Math.floor(loopProgress * frames.length) % frames.length;
        const frame = frames[index];
        if (frame) {
          setCurrentFrame(frame);
          setFrameIndex(index);
        }
      }

      // Continue animation
      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [frames, mode, speed, delay, onComplete, paused]);

  // Static frames can arrive after hydration. Derive static state directly so
  // reduced-motion users see the final frame without starting an animation.
  if (mode === 'static') {
    return {
      currentFrame: frames[frames.length - 1] || null,
      isComplete: true,
      frameIndex: Math.max(frames.length - 1, 0),
    };
  }

  return { currentFrame, isComplete, frameIndex };
}

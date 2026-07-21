/**
 * DitherCanvas Component
 *
 * Renders text with Bayer dithering effect using HTML5 Canvas.
 * Supports reveal, pulse, and static modes with full accessibility.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getDitherEngine } from '../system/canvas/DitherEngine';
import { useDitherAnimation } from '../system/hooks/useDitherAnimation';
import { useReducedMotion } from '../system/hooks/useReducedMotion';
import type { DitherCanvasProps } from './types';

export function DitherCanvas({
  text,
  mode,
  speed = 2000,
  threshold = 128,
  font = 'bold 120px Space Grotesk',
  color = 'currentColor',
  className = '',
  delay = 0,
  onComplete,
  lowDetail = false,
}: DitherCanvasProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Intentional hydration boundary: browser-only canvas work starts after
    // the server markup and first client render have matched.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  // Adjust mode for accessibility
  const effectiveMode = prefersReducedMotion ? 'static' : mode;

  // Get dither engine
  const engine = useMemo(() => getDitherEngine(lowDetail), [lowDetail]);

  // Get canvas scale for retina displays
  const scale = isHydrated ? window.devicePixelRatio || 1 : 1;

  // Generate animation frames
  const frames = useMemo(() => {
    // The server and the first client render must match. Generate browser-only
    // canvas frames after hydration, when devicePixelRatio is authoritative.
    if (!isHydrated) {
      return [];
    }

    try {
      const options = { font, threshold, color, scale, lowDetail };

      if (effectiveMode === 'reveal') {
        return engine.generateRevealFrames(text, options, 60);
      }

      if (effectiveMode === 'pulse') {
        return engine.generatePulseFrames(text, options, 30);
      }

      // Static mode - single frame
      return [engine.ditherText(text, options)];
    } catch (error) {
      console.error('Failed to generate dither frames:', error);
      return [];
    }
  }, [text, font, threshold, color, effectiveMode, engine, scale, lowDetail, isHydrated]);

  // Animate frames
  const { currentFrame } = useDitherAnimation({
    frames,
    mode: effectiveMode,
    speed,
    delay,
    onComplete,
  });

  // Render current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentFrame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = currentFrame.width;
    canvas.height = currentFrame.height;

    // Render frame
    ctx.putImageData(currentFrame, 0, 0);
  }, [currentFrame]);

  // Get canvas dimensions for styling
  const dimensions = useMemo(() => {
    if (frames.length === 0 || !frames[0]) return { width: 0, height: 0 };
    return {
      width: frames[0].width / scale,
      height: frames[0].height / scale,
    };
  }, [frames, scale]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Canvas element */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={text}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: 'block',
        }}
        className="max-w-full h-auto"
      />

      {/* Hidden text for screen readers */}
      <span className="sr-only">{text}</span>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';

export interface UseSlideshowOptions {
  totalSlides: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  loop?: boolean;
}

export interface UseSlideshowReturn {
  currentSlide: number;
  totalSlides: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  progress: number;
  direction: 'left' | 'right' | null;
  isFirst: boolean;
  isLast: boolean;
  isAutoPlaying: boolean;
  toggleAutoPlay: () => void;
}

export function useSlideshow({
  totalSlides,
  autoPlay = false,
  autoPlayInterval = 5000,
  loop = false,
}: UseSlideshowOptions): UseSlideshowReturn {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const isFirst = currentSlide === 0;
  const isLast = currentSlide === totalSlides - 1;
  const progress = totalSlides > 1 ? currentSlide / (totalSlides - 1) : 0;

  const next = useCallback(() => {
    if (isLast && !loop) return;
    setDirection('right');
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [isLast, loop, totalSlides]);

  const prev = useCallback(() => {
    if (isFirst && !loop) return;
    setDirection('left');
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [isFirst, loop, totalSlides]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;
      setDirection(index > currentSlide ? 'right' : 'left');
      setCurrentSlide(index);
    },
    [currentSlide, totalSlides]
  );

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause auto-play on any key press
      if (isAutoPlaying) {
        setIsAutoPlaying(false);
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(totalSlides - 1);
          break;
        case 'Escape':
          e.preventDefault();
          setIsAutoPlaying(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev, goTo, totalSlides, isAutoPlaying]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      if (isLast && !loop) {
        setIsAutoPlaying(false);
        return;
      }
      next();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, autoPlayInterval, next, isLast, loop]);

  return {
    currentSlide,
    totalSlides,
    next,
    prev,
    goTo,
    progress,
    direction,
    isFirst,
    isLast,
    isAutoPlaying,
    toggleAutoPlay,
  };
}

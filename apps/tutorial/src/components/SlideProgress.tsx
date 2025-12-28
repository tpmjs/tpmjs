'use client';

import { motion } from 'framer-motion';

interface SlideProgressProps {
  currentSlide: number;
  totalSlides: number;
  goTo: (index: number) => void;
}

export function SlideProgress({
  currentSlide,
  totalSlides,
  goTo,
}: SlideProgressProps): React.ReactElement {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => goTo(index)}
          className="group relative p-1"
          aria-label={`Go to slide ${index + 1}`}
        >
          <div
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/30 group-hover:bg-white/50'
              }
            `}
          />
          {index === currentSlide && (
            <motion.div
              layoutId="active-dot"
              className="absolute inset-0 m-auto w-4 h-4 rounded-full border border-white/50"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

interface SlideNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function SlideNavigation({
  onNext,
  onPrev,
  isFirst,
  isLast,
}: SlideNavigationProps): React.ReactElement {
  return (
    <>
      {/* Previous button */}
      <motion.button
        onClick={onPrev}
        disabled={isFirst}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isFirst ? 0.3 : 1, x: 0 }}
        whileHover={!isFirst ? { scale: 1.1 } : undefined}
        whileTap={!isFirst ? { scale: 0.95 } : undefined}
        className={`
          fixed left-8 top-1/2 -translate-y-1/2 z-50
          w-12 h-12 rounded-full
          bg-white/10 backdrop-blur-sm
          border border-white/20
          flex items-center justify-center
          transition-colors
          ${isFirst ? 'cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}
        `}
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {/* Next button */}
      <motion.button
        onClick={onNext}
        disabled={isLast}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isLast ? 0.3 : 1, x: 0 }}
        whileHover={!isLast ? { scale: 1.1 } : undefined}
        whileTap={!isLast ? { scale: 0.95 } : undefined}
        className={`
          fixed right-8 top-1/2 -translate-y-1/2 z-50
          w-12 h-12 rounded-full
          bg-white/10 backdrop-blur-sm
          border border-white/20
          flex items-center justify-center
          transition-colors
          ${isLast ? 'cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}
        `}
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </>
  );
}

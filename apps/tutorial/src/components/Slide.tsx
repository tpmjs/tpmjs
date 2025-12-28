'use client';

import { type Variants, motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SlideProps {
  children: ReactNode;
  isActive: boolean;
  direction: 'left' | 'right' | null;
}

const variants: Variants = {
  enter: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? '-100%' : '100%',
    opacity: 0,
  }),
};

export function Slide({ children, isActive, direction }: SlideProps): React.ReactElement | null {
  if (!isActive) return null;

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}

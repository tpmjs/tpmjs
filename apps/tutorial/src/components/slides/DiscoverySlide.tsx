'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(count, value, {
        duration: 2,
        ease: 'easeOut',
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [count, value, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [rounded]);

  return <span>{displayValue}</span>;
}

export function DiscoverySlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Background pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-blue-900/20 pointer-events-none"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-6xl mb-8"
        >
          🔍
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Automatic Discovery</h2>
        <p className="text-xl text-white/40 mb-12">
          npm changes feed synced every{' '}
          <span className="text-cyan-400 font-semibold">2 minutes</span>
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="text-5xl md:text-6xl font-bold text-cyan-400 font-mono">
              <AnimatedCounter value={78} delay={0.8} />+
            </div>
            <div className="text-white/40 mt-2">Tools Registered</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="text-5xl md:text-6xl font-bold text-purple-400 font-mono">2m</div>
            <div className="text-white/40 mt-2">Sync Interval</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="text-5xl md:text-6xl font-bold text-emerald-400 font-mono">24/7</div>
            <div className="text-white/40 mt-2">Always Running</div>
          </motion.div>
        </div>

        {/* Animated sync indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex items-center justify-center gap-3"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            className="w-3 h-3 rounded-full bg-emerald-400"
          />
          <span className="text-emerald-400/60 font-mono text-sm">Live sync active</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

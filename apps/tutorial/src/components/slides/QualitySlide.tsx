'use client';

import { animate, motion, useMotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';

function AnimatedGauge({ value, delay = 0 }: { value: number; delay?: number }) {
  const progress = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      animate(progress, value, {
        duration: 1.5,
        ease: 'easeOut',
      });
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [progress, value, delay]);

  useEffect(() => {
    const unsubscribe = progress.on('change', (v) => setDisplayValue(Math.round(v)));
    return unsubscribe;
  }, [progress]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg aria-hidden="true" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle cx="64" cy="64" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        {/* Progress circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{displayValue}%</span>
      </div>
    </div>
  );
}

const qualityFactors = [
  { name: 'Import Health', icon: '📦', score: 95, color: 'cyan', desc: 'Can we require() it?' },
  { name: 'Execution Health', icon: '▶️', score: 88, color: 'emerald', desc: 'Does it run at all?' },
  { name: 'HEALTHY', icon: '✅', score: 100, color: 'emerald', desc: 'Passed both checks' },
  { name: 'BROKEN', icon: '❌', score: 0, color: 'yellow', desc: 'Labeled, not hidden' },
];

export function QualitySlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-emerald-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-6xl mb-8"
        >
          ⭐
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Health Checks</h2>
        <p className="text-xl text-white/40 mb-12">
          We don&apos;t hide broken tools. We <span className="text-yellow-400">label them</span>.
        </p>

        {/* Main gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-12"
        >
          <AnimatedGauge value={92} delay={0.6} />
        </motion.div>

        {/* Quality factors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {qualityFactors.map((factor, index) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.15 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-3xl mb-2">{factor.icon}</div>
              <div className="text-base font-semibold text-white mb-1">{factor.name}</div>
              <div className="text-xs text-white/40 mb-3">{factor.desc}</div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factor.score}%` }}
                  transition={{ delay: 1.5 + index * 0.15, duration: 1 }}
                  className={`h-full rounded-full ${
                    factor.color === 'cyan'
                      ? 'bg-cyan-400'
                      : factor.color === 'purple'
                        ? 'bg-purple-400'
                        : factor.color === 'emerald'
                          ? 'bg-emerald-400'
                          : 'bg-yellow-400'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

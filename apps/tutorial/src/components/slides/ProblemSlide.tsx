'use client';

import { motion } from 'framer-motion';

const floatingIcons = [
  { icon: '🔧', x: '15%', y: '20%', delay: 0 },
  { icon: '⚙️', x: '75%', y: '15%', delay: 0.2 },
  { icon: '🔌', x: '85%', y: '60%', delay: 0.4 },
  { icon: '📦', x: '10%', y: '70%', delay: 0.6 },
  { icon: '🛠️', x: '60%', y: '80%', delay: 0.8 },
  { icon: '🔗', x: '25%', y: '45%', delay: 1 },
  { icon: '📡', x: '80%', y: '35%', delay: 1.2 },
  { icon: '💾', x: '40%', y: '25%', delay: 1.4 },
];

export function ProblemSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Floating chaotic icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl md:text-5xl opacity-20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 0.2,
            scale: 1,
            x: [0, Math.random() * 40 - 20, 0],
            y: [0, Math.random() * 40 - 20, 0],
            rotate: [0, Math.random() * 30 - 15, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: item.delay },
            scale: { duration: 0.5, delay: item.delay },
            x: {
              duration: 4 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            },
            y: {
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            },
            rotate: {
              duration: 5 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            },
          }}
          style={{ left: item.x, top: item.y }}
        >
          {item.icon}
        </motion.div>
      ))}

      {/* Red warning gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-orange-900/10 pointer-events-none" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 max-w-4xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-6xl mb-8"
        >
          😵
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">The Problem</h2>

        <p className="text-xl md:text-2xl text-white/60 leading-relaxed">
          AI tools are <span className="text-red-400 font-semibold">everywhere</span>.
          <br />
          Finding and trusting them is <span className="text-orange-400 font-semibold">hard</span>.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          {['Scattered', 'Inconsistent', 'Unverified', 'Fragmented'].map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="px-4 py-2 rounded-full border border-red-500/30 text-red-400/60 text-sm font-mono"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

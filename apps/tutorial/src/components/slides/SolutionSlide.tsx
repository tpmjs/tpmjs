'use client';

import { motion } from 'framer-motion';

const gridItems = Array.from({ length: 12 }, (_, i) => ({
  icon: ['🔧', '⚙️', '📦', '🔌', '🛠️', '📡', '💾', '🔗', '🎯', '⚡', '🌐', '🔐'][i],
  delay: i * 0.05,
}));

export function SolutionSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Green success gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      {/* Content */}
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
          ✨
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">The Solution</h2>

        <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-12">
          <span className="text-cyan-400 font-semibold">One registry</span>.
          <br />
          Curated tools. <span className="text-emerald-400 font-semibold">Quality guaranteed</span>.
        </p>

        {/* Organized grid of icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-4 md:grid-cols-6 gap-4 max-w-lg mx-auto"
        >
          {gridItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: 0.8 + item.delay,
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-white/10 hover:border-white/20 transition-colors cursor-default"
            >
              {item.icon}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          {['Organized', 'Consistent', 'Verified', 'Unified'].map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7 + i * 0.1 }}
              className="px-4 py-2 rounded-full border border-emerald-500/30 text-emerald-400/60 text-sm font-mono"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

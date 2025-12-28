'use client';

import { motion } from 'framer-motion';

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

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Two Users, One Surface</h2>
        <p className="text-xl text-white/40 mb-12">
          Same registry. <span className="text-cyan-400 font-semibold">Different clients.</span>
        </p>

        {/* Two user types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left"
          >
            <div className="text-4xl mb-4">👨‍💻</div>
            <div className="text-2xl font-bold text-cyan-400 mb-3">Engineers browsing</div>
            <ul className="space-y-2 text-white/60">
              <li>&quot;Show me the best extraction tools&quot;</li>
              <li>&quot;I need one that supports screenshots&quot;</li>
              <li>&quot;I need maintained + documented&quot;</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left"
          >
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-2xl font-bold text-purple-400 mb-3">Agents selecting</div>
            <ul className="space-y-2 text-white/60">
              <li>&quot;I need to scrape a URL into markdown&quot;</li>
              <li>&quot;I need to summarize a PDF with citations&quot;</li>
              <li>&quot;I need a company research tool&quot;</li>
            </ul>
          </motion.div>
        </div>

        {/* Key insight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-white/40 text-lg"
        >
          Results are <span className="text-emerald-400 font-semibold">tool-shaped</span>, not just package-shaped.
        </motion.div>
      </motion.div>
    </div>
  );
}

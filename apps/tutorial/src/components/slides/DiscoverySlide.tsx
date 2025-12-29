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
          ⚙️
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Schema Extraction</h2>
        <p className="text-xl text-white/40 mb-12">
          The hard part.{' '}
          <span className="text-cyan-400 font-semibold">We run your code in a sandbox.</span>
        </p>

        {/* Code block showing extraction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto p-6 rounded-xl bg-[#1e1e2e] text-left font-mono text-sm"
        >
          <div className="text-white/40 mb-3">
            {/* comment */}
            {'// We extract this from your actual code:'}
          </div>
          <div className="text-purple-400">inputSchema: {'{'}</div>
          <div className="text-white/80 pl-4">
            type: <span className="text-emerald-400">&quot;object&quot;</span>,
          </div>
          <div className="text-white/80 pl-4">properties: {'{'}</div>
          <div className="text-white/80 pl-8">
            url: {'{'} type: <span className="text-emerald-400">&quot;string&quot;</span>, format:{' '}
            <span className="text-emerald-400">&quot;uri&quot;</span> {'}'}
          </div>
          <div className="text-white/80 pl-8">
            timeout: {'{'} type: <span className="text-emerald-400">&quot;number&quot;</span>,
            default: <span className="text-cyan-400">30000</span> {'}'}
          </div>
          <div className="text-white/80 pl-4">{'}'}</div>
          <div className="text-purple-400">{'}'}</div>
        </motion.div>

        {/* Key insight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-white/40 text-lg"
        >
          Not documentation.{' '}
          <span className="text-emerald-400 font-semibold">
            Ground truth from TypeScript types.
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

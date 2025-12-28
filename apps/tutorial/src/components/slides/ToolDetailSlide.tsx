'use client';

import { motion } from 'framer-motion';

export function ToolDetailSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Tool-Shaped Results</h2>
        <p className="text-xl text-white/40 mb-12">Remove guesswork before you integrate</p>

        {/* Mock tool card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-left"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl"
                >
                  🔍
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white">webSearch</h3>
                  <span className="text-sm text-white/40 font-mono">@tpmjs/web-tools</span>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium"
            >
              Verified
            </motion.div>
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/60 mb-6"
          >
            Search the web and return structured results. Supports query filtering, result limits,
            and domain restrictions.
          </motion.p>

          {/* Metadata grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-white/40 mb-1">Downloads</div>
              <div className="text-lg font-bold text-white">12.4k</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-white/40 mb-1">Quality</div>
              <div className="text-lg font-bold text-cyan-400">94%</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-white/40 mb-1">Category</div>
              <div className="text-lg font-bold text-purple-400">Search</div>
            </div>
          </motion.div>

          {/* Schema preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="p-4 rounded-lg bg-black/30 font-mono text-sm"
          >
            <div className="text-white/40 mb-2">// Input Schema</div>
            <div className="text-cyan-400">
              query: <span className="text-white/60">string</span>
            </div>
            <div className="text-cyan-400">
              limit?: <span className="text-white/60">number</span>
            </div>
            <div className="text-cyan-400">
              domains?: <span className="text-white/60">string[]</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

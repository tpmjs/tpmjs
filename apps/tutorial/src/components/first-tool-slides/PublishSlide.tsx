'use client';

import { motion } from 'framer-motion';

export function PublishSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-amber-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-orange-400/60 font-mono text-sm mb-4">Step 4</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Publish to npm</h2>
        <p className="text-xl text-white/50 mb-10">Build and publish your tool</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">Terminal</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-white/50"># Build TypeScript</span>
              {'\n'}
              <span className="text-orange-400">npm</span>
              <span className="text-white"> run build</span>
              {'\n\n'}
              <span className="text-white/50"># Publish to npm</span>
              {'\n'}
              <span className="text-orange-400">npm</span>
              <span className="text-white"> publish</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-xs text-white/50">Published to npm</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-xs text-white/50">Synced in ~2 min</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
            <div className="text-2xl mb-2">✨</div>
            <div className="text-xs text-white/50">Live on tpmjs.com</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-white/40 text-sm font-mono"
        >
          TPMJS syncs from npm's changes feed every 2 minutes
        </motion.div>
      </motion.div>
    </div>
  );
}

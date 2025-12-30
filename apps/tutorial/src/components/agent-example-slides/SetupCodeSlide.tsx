'use client';

import { motion } from 'framer-motion';

export function SetupCodeSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-pink-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-rose-400/60 font-mono text-sm mb-4">Step 1</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Install & Setup</h2>
        <p className="text-xl text-white/50 mb-8">Add the TPMJS meta-tools to your project</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">Terminal</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-rose-400">npm</span>
              <span className="text-white">
                {' '}
                install @tpmjs/search-registry @tpmjs/registry-execute
              </span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">agent.ts</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-purple-400">import</span>
              <span className="text-white">{' { searchTpmjsToolsTool } '}</span>
              <span className="text-purple-400">from</span>
              {'\n'}
              <span className="text-amber-300">{" '@tpmjs/search-registry'"}</span>
              <span className="text-white">;</span>
              {'\n'}
              <span className="text-purple-400">import</span>
              <span className="text-white">{' { registryExecuteTool } '}</span>
              <span className="text-purple-400">from</span>
              {'\n'}
              <span className="text-amber-300">{" '@tpmjs/registry-execute'"}</span>
              <span className="text-white">;</span>
              {'\n'}
              <span className="text-purple-400">import</span>
              <span className="text-white">{' { generateText } '}</span>
              <span className="text-purple-400">from</span>
              <span className="text-amber-300">{" 'ai'"}</span>
              <span className="text-white">;</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-white/40 text-sm font-mono"
        >
          Two tools that give your agent access to the entire registry
        </motion.div>
      </motion.div>
    </div>
  );
}

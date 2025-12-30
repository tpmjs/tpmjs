'use client';

import { motion } from 'framer-motion';

export function SeeResultsSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-sky-400/60 font-mono text-sm mb-4">Step 4</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">See Results</h2>
        <p className="text-xl text-white/50 mb-10">Tool executes in a secure sandbox</p>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d1117] rounded-xl border border-white/10 p-5 text-left"
          >
            <div className="text-xs text-white/40 font-mono mb-3">Input</div>
            <pre className="text-sm font-mono text-white/60 overflow-x-auto">
              {JSON.stringify(
                {
                  text: 'Hello world, I love coding!',
                  style: 'expressive',
                },
                null,
                2
              )}
            </pre>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0d1117] rounded-xl border border-green-500/20 p-5 text-left"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div className="text-xs text-green-400 font-mono">Success</div>
            </div>
            <pre className="text-sm font-mono text-white/80 overflow-x-auto">
              {JSON.stringify(
                {
                  result: '👋🌍, 💖💻!',
                  emoji_count: 4,
                },
                null,
                2
              )}
            </pre>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-3 gap-4 max-w-xl mx-auto"
        >
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-sky-400">127ms</div>
            <div className="text-xs text-white/40">Execution time</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-green-400">✓</div>
            <div className="text-xs text-white/40">Sandboxed</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-center">
            <div className="text-lg font-bold text-purple-400">JSON</div>
            <div className="text-xs text-white/40">Output format</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

export function ProjectSetupSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-amber-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-orange-400/60 font-mono text-sm mb-4">Step 1</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Project Setup</h2>
        <p className="text-xl text-white/50 mb-10">Create a new npm package</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">Terminal</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-white/50"># Create directory</span>
              {'\n'}
              <span className="text-orange-400">mkdir</span>
              <span className="text-white"> my-ai-tool</span>
              {'\n'}
              <span className="text-orange-400">cd</span>
              <span className="text-white"> my-ai-tool</span>
              {'\n\n'}
              <span className="text-white/50"># Initialize package</span>
              {'\n'}
              <span className="text-orange-400">npm</span>
              <span className="text-white"> init -y</span>
              {'\n\n'}
              <span className="text-white/50"># Install dependencies</span>
              {'\n'}
              <span className="text-orange-400">npm</span>
              <span className="text-white"> install ai zod</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center justify-center gap-4 text-white/40 text-sm"
        >
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            ai
          </span>
          <span className="text-white/20">+</span>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            zod
          </span>
          <span className="text-white/30 ml-2">= AI SDK tools</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

export function TheGoalSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-pink-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">The Goal</h2>
        <p className="text-xl text-white/50 mb-10">
          An agent that can handle any request by finding the right tools
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-4">User Request</div>
          <p className="text-lg text-white/80 italic">
            "Convert this markdown to a formatted blog post and generate a summary"
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center"
        >
          <svg
            className="w-6 h-6 text-rose-400/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
            <div className="text-rose-400 font-semibold text-sm mb-1">1. Search</div>
            <div className="text-xs text-white/50">Find markdown tools</div>
          </div>
          <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20 text-center">
            <div className="text-pink-400 font-semibold text-sm mb-1">2. Execute</div>
            <div className="text-xs text-white/50">Format the content</div>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="text-purple-400 font-semibold text-sm mb-1">3. Return</div>
            <div className="text-xs text-white/50">Give result to user</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

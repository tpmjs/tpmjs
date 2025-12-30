'use client';

import { motion } from 'framer-motion';

export function AgentExampleNextStepsSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-900/20 via-transparent to-pink-900/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Try It Yourself</h2>
        <p className="text-xl text-white/50 mb-10">Complete working example</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">Clone & Run</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-rose-400">git clone</span>
              <span className="text-white"> github.com/tpmjs/agent-example</span>
              {'\n'}
              <span className="text-rose-400">cd</span>
              <span className="text-white"> agent-example</span>
              {'\n'}
              <span className="text-rose-400">npm</span>
              <span className="text-white"> install</span>
              {'\n'}
              <span className="text-rose-400">npm</span>
              <span className="text-white"> run dev</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-2 gap-4 max-w-xl mx-auto"
        >
          <a
            href="https://tpmjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-xl bg-white/5 border border-rose-500/20 text-left hover:bg-white/10 hover:border-rose-500/40 transition-all group"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm font-semibold text-rose-400 mb-1">Browse Registry</div>
            <div className="text-xs text-white/50">See all available tools</div>
          </a>
          <a
            href="/agents"
            className="p-5 rounded-xl bg-white/5 border border-pink-500/20 text-left hover:bg-white/10 hover:border-pink-500/40 transition-all group"
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="text-sm font-semibold text-pink-400 mb-1">Agent Docs</div>
            <div className="text-xs text-white/50">Deep dive into meta-tools</div>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-white/30 text-xs font-mono"
        >
          Your agent can now use 200+ tools without installing any of them
        </motion.div>
      </motion.div>
    </div>
  );
}

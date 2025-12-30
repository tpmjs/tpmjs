'use client';

import { motion } from 'framer-motion';

export function OpenPlaygroundSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-sky-400/60 font-mono text-sm mb-4">Step 2</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Open the Playground</h2>
        <p className="text-xl text-white/50 mb-10">Click "Try it" on any tool page</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden max-w-2xl mx-auto"
        >
          {/* Mock browser header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-white/40 font-mono bg-white/5 px-3 py-1 rounded">
                tpmjs.com/tool/@tpmjs/emoji-magic/textToEmoji
              </span>
            </div>
          </div>

          {/* Mock tool page */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-white/40 font-mono mb-1">@tpmjs/emoji-magic</div>
                <div className="text-2xl font-bold text-white">textToEmoji</div>
                <div className="text-sm text-white/50 mt-1">Convert text to emojis</div>
              </div>
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium cursor-pointer"
              >
                Try it →
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="p-3 rounded bg-white/5">
                <div className="text-xs text-white/40 mb-1">Parameters</div>
                <div className="text-sm text-white/60 font-mono">text, style?</div>
              </div>
              <div className="p-3 rounded bg-white/5">
                <div className="text-xs text-white/40 mb-1">Health</div>
                <div className="text-sm text-green-400">✓ Healthy</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-lg bg-sky-500/10 border border-sky-500/20 max-w-md mx-auto"
        >
          <p className="text-sky-400 text-sm">
            Every tool page has a "Try it" button that opens the playground
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

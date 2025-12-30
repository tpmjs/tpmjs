'use client';

import { motion } from 'framer-motion';

export function FindToolSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-sky-400/60 font-mono text-sm mb-4">Step 1</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Find a Tool</h2>
        <p className="text-xl text-white/50 mb-10">Browse or search the registry</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-white/5 rounded-lg px-4 py-3 text-left">
              <span className="text-white/30">🔍</span>
              <span className="text-white/50 ml-2">Search tools...</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { name: 'textToEmoji', pkg: '@tpmjs/emoji-magic', desc: 'Convert text to emojis' },
              { name: 'markdownFormat', pkg: '@tpmjs/markdown-formatter', desc: 'Format markdown' },
              { name: 'helloWorld', pkg: '@tpmjs/hello', desc: 'Simple greeting tool' },
            ].map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded bg-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-mono">
                  fn
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/80 font-medium">{tool.name}</div>
                  <div className="text-xs text-white/40">{tool.pkg}</div>
                </div>
                <div className="text-xs text-white/30">{tool.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-white/40 text-sm font-mono"
        >
          tpmjs.com — Browse 200+ tools by category
        </motion.div>
      </motion.div>
    </div>
  );
}

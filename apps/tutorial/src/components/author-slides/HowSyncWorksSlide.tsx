'use client';

import { motion } from 'framer-motion';

const syncSteps = [
  { step: '1', text: 'You publish to npm with tpmjs-tool keyword', color: 'purple' },
  { step: '2', text: 'Registry detects your package within 2 minutes', color: 'cyan' },
  { step: '3', text: 'We extract schemas from your package.json', color: 'emerald' },
  { step: '4', text: 'Your tool appears in search results', color: 'yellow' },
];

export function HowSyncWorksSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Automatic Discovery</h2>
        <p className="text-xl text-white/50 mb-12">Publish once. We handle the rest.</p>

        <div className="space-y-4 text-left max-w-xl mx-auto">
          {syncSteps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-start gap-4"
            >
              <span
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-mono ${
                  item.color === 'purple'
                    ? 'bg-purple-500/20 text-purple-400'
                    : item.color === 'cyan'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : item.color === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {item.step}
              </span>
              <span className="text-white/70 pt-2">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
        >
          <code className="text-purple-400 font-mono text-sm">npm publish</code>
          <div className="text-white/40 text-sm mt-1">No registration. No API keys. Just npm.</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

const features = [
  { icon: '🔍', title: 'Discoverable', desc: 'Agents search by natural language query' },
  { icon: '📦', title: 'npm-native', desc: 'Synced from npm every 2 minutes' },
  { icon: '⚡', title: 'Instant Execution', desc: 'Run in sandbox, no install needed' },
];

export function WhatIsRegistrySlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-purple-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What is TPMJS?</h2>
        <p className="text-xl text-white/50 mb-12">A tool registry for the Vercel AI SDK</p>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className="p-6 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <div className="text-lg font-semibold text-white mb-2">{feature.title}</div>
              <div className="text-sm text-white/50">{feature.desc}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-white/40 text-sm"
        >
          AI agents use TPMJS to find and run tools they don&apos;t have installed.
        </motion.div>
      </motion.div>
    </div>
  );
}

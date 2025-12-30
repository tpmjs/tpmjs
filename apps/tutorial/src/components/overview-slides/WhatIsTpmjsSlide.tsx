'use client';

import { motion } from 'framer-motion';

const concepts = [
  {
    title: 'A Registry',
    description: 'A curated database of AI SDK-compatible tools published to npm',
    icon: '📦',
  },
  {
    title: 'A Discovery API',
    description: 'Agents search for tools by query, category, or context at runtime',
    icon: '🔍',
  },
  {
    title: 'A Sandbox Executor',
    description: 'Run any tool from the registry securely without installing it',
    icon: '⚡',
  },
];

export function WhatIsTpmjsSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What is TPMJS?</h2>
        <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto">
          Think of it as npm for AI agent tools — but with runtime discovery and execution
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {concepts.map((concept, index) => (
            <motion.div
              key={concept.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className="p-6 rounded-xl bg-white/5 border border-emerald-500/20 text-left"
            >
              <div className="text-4xl mb-4">{concept.icon}</div>
              <div className="text-lg font-semibold text-emerald-400 mb-3">{concept.title}</div>
              <div className="text-sm text-white/50">{concept.description}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-10 text-white/40 text-sm font-mono"
        >
          Built on the Vercel AI SDK tool specification
        </motion.div>
      </motion.div>
    </div>
  );
}

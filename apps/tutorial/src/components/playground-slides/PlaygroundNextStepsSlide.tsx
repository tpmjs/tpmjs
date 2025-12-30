'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: 'Test Parameters',
    description: 'Understand what each tool expects before integrating',
    icon: '🧪',
  },
  {
    title: 'Debug Issues',
    description: 'See exact inputs and outputs to troubleshoot',
    icon: '🔧',
  },
  {
    title: 'Evaluate Quality',
    description: 'Check if a tool does what you need before using it',
    icon: '✅',
  },
  {
    title: 'Share Examples',
    description: 'Copy the URL to share working examples',
    icon: '🔗',
  },
];

export function PlaygroundNextStepsSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-transparent to-blue-900/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Use Cases</h2>
        <p className="text-xl text-white/50 mb-10">Why the playground is useful</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-5 rounded-xl bg-white/5 border border-sky-500/20 text-left"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <div className="text-sm font-semibold text-sky-400 mb-1">{feature.title}</div>
              <div className="text-xs text-white/50">{feature.description}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10"
        >
          <a
            href="https://tpmjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 transition-colors"
          >
            Try the Playground
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-white/30 text-xs font-mono"
        >
          Every tool on tpmjs.com has a playground — try any of them
        </motion.div>
      </motion.div>
    </div>
  );
}

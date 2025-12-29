'use client';

import { motion } from 'framer-motion';

const tools = [
  {
    name: 'searchTpmjsToolsTool',
    package: '@tpmjs/search-registry',
    description: 'Agent searches the registry by query, category, or context',
    color: 'cyan',
  },
  {
    name: 'registryExecuteTool',
    package: '@tpmjs/registry-execute',
    description: 'Agent executes a discovered tool by ID in a sandbox',
    color: 'purple',
  },
];

export function HowItWorksSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-purple-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Two Meta-Tools</h2>
        <p className="text-xl text-white/50 mb-12">Tools that discover and execute other tools</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.2 }}
              className={`p-6 rounded-xl bg-white/5 border text-left ${
                tool.color === 'cyan' ? 'border-cyan-500/30' : 'border-purple-500/30'
              }`}
            >
              <div
                className={`text-xs font-mono mb-2 ${
                  tool.color === 'cyan' ? 'text-cyan-400/60' : 'text-purple-400/60'
                }`}
              >
                {tool.package}
              </div>
              <div
                className={`text-lg font-semibold mb-3 ${
                  tool.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                }`}
              >
                {tool.name}
              </div>
              <div className="text-sm text-white/50">{tool.description}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-white/40 text-sm font-mono"
        >
          Both are standard AI SDK tools. Pass them to generateText like any other.
        </motion.div>
      </motion.div>
    </div>
  );
}

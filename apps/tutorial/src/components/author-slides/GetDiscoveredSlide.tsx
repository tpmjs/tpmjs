'use client';

import { motion } from 'framer-motion';

const searchExample = [
  { id: 'agent', line: 'Agent: "I need to format some markdown"', color: 'white' },
  { id: 'search', line: 'searchTpmjsToolsTool({ query: "markdown format" })', color: 'cyan' },
  { id: 'result', line: '→ Found: @your-org/tools::formatMarkdownTable', color: 'emerald' },
  { id: 'execute', line: 'registryExecuteTool({ toolId: "...", params })', color: 'purple' },
  { id: 'done', line: '→ Your tool runs. Agent gets result.', color: 'yellow' },
];

export function GetDiscoveredSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-purple-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How Agents Find You</h2>
        <p className="text-xl text-white/50 mb-10">Your tool in action</p>

        <div className="space-y-3 text-left max-w-xl mx-auto">
          {searchExample.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: item.id === 'agent' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`p-3 rounded-lg font-mono text-sm ${
                item.id === 'agent' ? 'bg-white/5' : 'bg-white/5 ml-4'
              }`}
            >
              <span
                className={
                  item.color === 'cyan'
                    ? 'text-cyan-400'
                    : item.color === 'purple'
                      ? 'text-purple-400'
                      : item.color === 'emerald'
                        ? 'text-emerald-400'
                        : item.color === 'yellow'
                          ? 'text-yellow-400'
                          : 'text-white/70'
                }
              >
                {item.line}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="text-sm text-white/60">
            The agent never installed your package.
            <br />
            <span className="text-cyan-400">They found and ran it at runtime.</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

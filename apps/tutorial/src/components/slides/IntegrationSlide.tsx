'use client';

import { motion } from 'framer-motion';

const executeSchema = [
  '  toolId: z.string(),',
  '  params: z.record(z.unknown()),',
  '  env?: z.record(z.string()),',
];

const flowSteps = [
  { step: '1', text: 'Fetch tool metadata from registry', color: 'cyan' },
  { step: '2', text: 'Import package from esm.sh', color: 'purple' },
  { step: '3', text: 'Execute in isolated sandbox', color: 'emerald' },
  { step: '4', text: 'Return result to agent', color: 'yellow' },
];

export function IntegrationSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-emerald-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">registryExecuteTool</h2>
        <p className="text-xl text-white/50 mb-10">
          Run any tool from the registry. No install. No bundle.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <div className="text-xs text-purple-400/60 font-mono mb-2">inputSchema</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-sm">
              <div className="text-white/40">{'z.object({'}</div>
              {executeSchema.map((line) => (
                <div key={line} className="text-purple-400 pl-2">
                  {line}
                </div>
              ))}
              <div className="text-white/40">{'})'}</div>
            </div>
          </motion.div>

          {/* Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left"
          >
            <div className="text-xs text-white/40 font-mono mb-2">execution flow</div>
            <div className="space-y-2">
              {flowSteps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                      item.color === 'cyan'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : item.color === 'purple'
                          ? 'bg-purple-500/20 text-purple-400'
                          : item.color === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {item.step}
                  </span>
                  <span className="text-sm text-white/60">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-white/40 text-sm"
        >
          Sandbox runs on Railway. 5s timeout. Isolated per execution.
        </motion.div>
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    step: '1',
    action: 'Agent receives request',
    detail: '"Format this markdown..."',
    color: 'rose',
  },
  {
    step: '2',
    action: 'Calls searchTpmjsToolsTool',
    detail: 'query: "markdown formatter"',
    color: 'pink',
  },
  {
    step: '3',
    action: 'Receives tool list',
    detail: '[markdownFormat, mdToHtml, ...]',
    color: 'purple',
  },
  {
    step: '4',
    action: 'Calls registryExecuteTool',
    detail: 'toolId: "markdownFormat", args: {...}',
    color: 'violet',
  },
  {
    step: '5',
    action: 'Returns result to user',
    detail: 'Formatted blog post',
    color: 'indigo',
  },
];

export function ExecutionFlowSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-pink-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Execution Flow</h2>
        <p className="text-xl text-white/50 mb-10">What happens when the agent runs</p>

        <div className="space-y-3 max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-${step.color}-500/20`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.color === 'rose'
                    ? 'bg-rose-500/20 text-rose-400'
                    : step.color === 'pink'
                      ? 'bg-pink-500/20 text-pink-400'
                      : step.color === 'purple'
                        ? 'bg-purple-500/20 text-purple-400'
                        : step.color === 'violet'
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                {step.step}
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold text-white/80">{step.action}</div>
                <div className="text-xs text-white/40 font-mono">{step.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-white/40 text-sm font-mono"
        >
          All tool execution happens in a secure sandbox
        </motion.div>
      </motion.div>
    </div>
  );
}

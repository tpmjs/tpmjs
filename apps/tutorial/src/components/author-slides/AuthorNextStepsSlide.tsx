'use client';

import { motion } from 'framer-motion';

const steps = [
  { num: '1', text: 'Add "tpmjs-tool" to your package.json keywords' },
  { num: '2', text: 'Define your tools in the "tpmjs" field' },
  { num: '3', text: 'npm publish' },
];

export function AuthorNextStepsSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-[100px]"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Publish?</h2>
        <p className="text-xl text-white/50 mb-10">Three steps. That&apos;s it.</p>

        <div className="space-y-4 max-w-md mx-auto mb-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 text-left"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono text-lg">
                {step.num}
              </span>
              <span className="text-white/70">{step.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <a
            href="https://tpmjs.com/tool-search"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors"
          >
            Browse Existing Tools
          </a>
          <a
            href="https://tpmjs.com/playground"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Try the Playground
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-white/30 text-sm"
        >
          Indexed within 2 minutes. No registration required.
        </motion.div>
      </motion.div>
    </div>
  );
}

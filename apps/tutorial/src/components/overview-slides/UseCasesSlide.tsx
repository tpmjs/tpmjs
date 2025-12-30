'use client';

import { motion } from 'framer-motion';

const useCases = [
  {
    persona: 'AI Agent Developers',
    useCase: 'Give agents dynamic capabilities without bundling tools',
    example: '"Find me a weather tool" → Agent discovers and uses it',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    persona: 'Tool Authors',
    useCase: 'Get your AI SDK tools discovered by agents worldwide',
    example: 'npm publish with tpmjs-tool keyword → Indexed in minutes',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    persona: 'Platform Builders',
    useCase: 'Build agent platforms with extensible tool ecosystems',
    example: 'Users bring their own tools, you provide the runtime',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export function UseCasesSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Who Uses TPMJS?</h2>
        <p className="text-xl text-white/50 mb-12">Three audiences, shared ecosystem</p>

        <div className="space-y-4 max-w-3xl mx-auto">
          {useCases.map((item, index) => (
            <motion.div
              key={item.persona}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className="p-6 rounded-xl bg-white/5 border border-white/10 text-left flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="md:w-1/3">
                <div
                  className={`text-lg font-semibold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}
                >
                  {item.persona}
                </div>
              </div>
              <div className="md:w-2/3">
                <div className="text-sm text-white/70 mb-1">{item.useCase}</div>
                <div className="text-xs text-white/40 font-mono">{item.example}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-white/40 text-sm"
        >
          All built on standard npm packages and the AI SDK specification
        </motion.div>
      </motion.div>
    </div>
  );
}

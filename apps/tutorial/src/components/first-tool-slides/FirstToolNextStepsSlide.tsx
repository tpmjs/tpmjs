'use client';

import { motion } from 'framer-motion';

const nextSteps = [
  {
    title: 'Add Rich Metadata',
    description: 'Include tpmjs field in package.json for better quality scores',
    href: '/authors',
    icon: '📋',
  },
  {
    title: 'Test in Playground',
    description: 'Try your tool at tpmjs.com/tool/your-package/yourTool',
    href: '/playground',
    icon: '🎮',
  },
  {
    title: 'View on Registry',
    description: 'See how agents discover your tool',
    href: 'https://tpmjs.com',
    icon: '🔍',
  },
];

export function FirstToolNextStepsSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-amber-900/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{"You're Published!"}</h2>
        <p className="text-xl text-white/50 mb-12">Your tool is now discoverable by AI agents</p>

        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {nextSteps.map((step, index) => (
            <motion.a
              key={step.title}
              href={step.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-5 rounded-xl bg-white/5 border border-orange-500/20 text-left hover:bg-white/10 hover:border-orange-500/40 transition-all group cursor-pointer"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <div className="text-sm font-semibold text-orange-400 mb-1">{step.title}</div>
              <div className="text-xs text-white/50">{step.description}</div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 max-w-md mx-auto"
        >
          <p className="text-white/70 text-sm mb-2">Complete code example:</p>
          <code className="text-orange-400 font-mono text-sm">github.com/tpmjs/example-tool</code>
        </motion.div>
      </motion.div>
    </div>
  );
}

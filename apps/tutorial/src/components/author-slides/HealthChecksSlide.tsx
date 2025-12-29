'use client';

import { motion } from 'framer-motion';

const checks = [
  {
    status: 'HEALTHY',
    icon: '✓',
    title: 'Import Health',
    desc: 'We require() your package to verify it loads',
    color: 'emerald',
  },
  {
    status: 'HEALTHY',
    icon: '✓',
    title: 'Execution Health',
    desc: 'We call your tool with test params',
    color: 'emerald',
  },
  {
    status: 'BROKEN',
    icon: '!',
    title: 'Labeled, Not Hidden',
    desc: 'Failed tools show warning, still searchable',
    color: 'yellow',
  },
];

export function HealthChecksSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-yellow-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Health Checks</h2>
        <p className="text-xl text-white/50 mb-12">We verify your tools actually work</p>

        <div className="space-y-4 max-w-xl mx-auto">
          {checks.map((check, i) => (
            <motion.div
              key={check.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 text-left"
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                  check.color === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {check.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white">{check.title}</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      check.status === 'HEALTHY'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
                <div className="text-sm text-white/50">{check.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-white/40 text-sm"
        >
          Health checks run hourly. Fix issues anytime by publishing a new version.
        </motion.div>
      </motion.div>
    </div>
  );
}

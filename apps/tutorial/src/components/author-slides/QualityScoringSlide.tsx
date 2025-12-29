'use client';

import { motion } from 'framer-motion';

const factors = [
  {
    name: 'Schema Completeness',
    weight: '40%',
    desc: 'Rich parameter definitions with types and descriptions',
    color: 'cyan',
  },
  {
    name: 'npm Downloads',
    weight: '30%',
    desc: 'Community adoption signals quality',
    color: 'purple',
  },
  {
    name: 'Health Status',
    weight: '20%',
    desc: 'Can it import and execute successfully?',
    color: 'emerald',
  },
  {
    name: 'Documentation',
    weight: '10%',
    desc: 'Good descriptions help agents choose',
    color: 'yellow',
  },
];

export function QualityScoringSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Quality Score</h2>
        <p className="text-xl text-white/50 mb-10">Higher scores = better search ranking</p>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {factors.map((factor, i) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    factor.color === 'cyan'
                      ? 'text-cyan-400'
                      : factor.color === 'purple'
                        ? 'text-purple-400'
                        : factor.color === 'emerald'
                          ? 'text-emerald-400'
                          : 'text-yellow-400'
                  }`}
                >
                  {factor.name}
                </span>
                <span className="text-xs font-mono text-white/40">{factor.weight}</span>
              </div>
              <div className="text-xs text-white/50">{factor.desc}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-md mx-auto"
        >
          <div className="text-emerald-400 font-mono text-sm">qualityScore: 0.92</div>
          <div className="text-white/40 text-xs mt-1">
            Rich schemas + healthy + documented = high score
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

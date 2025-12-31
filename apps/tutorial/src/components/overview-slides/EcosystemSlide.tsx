'use client';

import { motion } from 'framer-motion';

const participants = [
  {
    role: 'Package Authors',
    action: 'Publish tools to npm with tpmjs keyword',
    color: 'purple',
  },
  {
    role: 'TPMJS Registry',
    action: 'Syncs from npm, extracts schemas, scores quality',
    color: 'emerald',
  },
  {
    role: 'Agent Developers',
    action: 'Use meta-tools to search and execute at runtime',
    color: 'cyan',
  },
];

export function EcosystemSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-emerald-900/5 to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">The Ecosystem</h2>
        <p className="text-xl text-white/50 mb-12">Three participants, one registry</p>

        {/* Flow diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.2 }}
              className="flex items-center gap-4"
            >
              <div
                className={`p-6 rounded-xl bg-white/5 border text-left min-w-[200px] ${
                  participant.color === 'purple'
                    ? 'border-purple-500/30'
                    : participant.color === 'emerald'
                      ? 'border-emerald-500/30'
                      : 'border-cyan-500/30'
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    participant.color === 'purple'
                      ? 'text-purple-400'
                      : participant.color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                  }`}
                >
                  {participant.role}
                </div>
                <div className="text-xs text-white/50">{participant.action}</div>
              </div>

              {/* Arrow between items */}
              {index < participants.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.2 }}
                  className="text-white/30 hidden md:block"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 p-4 rounded-lg bg-white/5 border border-white/10 max-w-md mx-auto"
        >
          <p className="text-sm text-white/60">
            <span className="text-emerald-400 font-semibold">200+</span> tools from{' '}
            <span className="text-purple-400 font-semibold">50+</span> packages available today
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

const steps = [
  { icon: '📦', label: 'npm publish', description: 'Publish your tool to npm' },
  { icon: '🔍', label: 'Discovery', description: 'Automatic detection' },
  { icon: '📋', label: 'Registry', description: 'Added to TPMJS' },
  { icon: '🤖', label: 'AI Agent', description: 'Ready to use' },
];

export function HowItWorksSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-xl text-white/40 mb-16">From npm to AI in 4 simple steps</p>

        {/* Flow diagram */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              {/* Step card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.2 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.5 + index * 0.2,
                    type: 'spring',
                    stiffness: 300,
                  }}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-4xl md:text-5xl mb-4 hover:from-white/15 hover:to-white/10 transition-colors"
                >
                  {step.icon}
                </motion.div>
                <span className="text-white font-semibold text-lg">{step.label}</span>
                <span className="text-white/40 text-sm mt-1">{step.description}</span>
              </motion.div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.8 + index * 0.2 }}
                  className="hidden md:flex items-center mx-6"
                >
                  <div className="w-12 h-px bg-gradient-to-r from-cyan-500/50 to-purple-500/50" />
                  <svg
                    className="w-4 h-4 text-purple-500/50 -ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Animated highlight line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-16 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent rounded-full max-w-md mx-auto"
        />
      </motion.div>
    </div>
  );
}

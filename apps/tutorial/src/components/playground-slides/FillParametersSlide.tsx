'use client';

import { motion } from 'framer-motion';

export function FillParametersSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-sky-400/60 font-mono text-sm mb-4">Step 3</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Fill Parameters</h2>
        <p className="text-xl text-white/50 mb-10">
          The form is auto-generated from the tool's schema
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 max-w-lg mx-auto text-left"
        >
          <div className="text-sm text-white/60 font-medium mb-4">textToEmoji Parameters</div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-white/40 block mb-2">
                text <span className="text-red-400">*</span>
              </div>
              <motion.input
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                type="text"
                defaultValue="Hello world, I love coding!"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-sky-500/50 focus:outline-none"
                aria-label="text parameter"
              />
            </div>

            <div>
              <div className="text-xs text-white/40 block mb-2">style</div>
              <select
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-sky-500/50 focus:outline-none appearance-none"
                aria-label="style parameter"
              >
                <option value="default">default</option>
                <option value="minimal">minimal</option>
                <option value="expressive">expressive</option>
              </select>
            </div>
          </div>

          <motion.button
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="w-full mt-6 px-4 py-3 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors"
          >
            Execute Tool
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-white/40 text-sm font-mono"
        >
          Required fields are marked with * — optional fields have defaults
        </motion.div>
      </motion.div>
    </div>
  );
}

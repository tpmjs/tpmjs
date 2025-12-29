'use client';

import { motion } from 'framer-motion';

const registryData = [
  { field: 'toolId', value: '"@tpmjs/markdown::formatTable"', color: 'cyan' },
  { field: 'description', value: '"Format markdown tables"', color: 'white' },
  { field: 'inputSchema', value: '{ type: "object", ... }', color: 'purple' },
  { field: 'returnSchema', value: '{ type: "string" }', color: 'purple' },
  { field: 'envKeys', value: '[]', color: 'yellow' },
  { field: 'qualityScore', value: '0.92', color: 'emerald' },
];

const qualityFactors = [
  { name: 'Schema Completeness', desc: 'Input/output types defined' },
  { name: 'npm Downloads', desc: 'Community adoption signal' },
  { name: 'Health Status', desc: 'Can it import and execute?' },
];

export function QualitySlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/10 via-transparent to-emerald-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">What Gets Indexed</h2>
        <p className="text-xl text-white/50 mb-10">
          Schemas extracted. Quality scored. Health checked.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Registry entry */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <div className="text-xs text-emerald-400/60 font-mono mb-2">registry entry</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-sm">
              <div className="text-white/40">{'{'}</div>
              {registryData.map((item) => (
                <div key={item.field} className="pl-2">
                  <span className="text-white/60">{item.field}: </span>
                  <span
                    className={
                      item.color === 'cyan'
                        ? 'text-cyan-400'
                        : item.color === 'purple'
                          ? 'text-purple-400'
                          : item.color === 'emerald'
                            ? 'text-emerald-400'
                            : item.color === 'yellow'
                              ? 'text-yellow-400'
                              : 'text-white/60'
                    }
                  >
                    {item.value}
                  </span>
                </div>
              ))}
              <div className="text-white/40">{'}'}</div>
            </div>
          </motion.div>

          {/* Quality factors */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left"
          >
            <div className="text-xs text-yellow-400/60 font-mono mb-2">qualityScore factors</div>
            <div className="space-y-3">
              {qualityFactors.map((factor, i) => (
                <motion.div
                  key={factor.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="text-sm font-medium text-white">{factor.name}</div>
                  <div className="text-xs text-white/40">{factor.desc}</div>
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
          Synced from npm every 2 minutes. 200+ tools indexed.
        </motion.div>
      </motion.div>
    </div>
  );
}

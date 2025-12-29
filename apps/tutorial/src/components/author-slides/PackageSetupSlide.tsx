'use client';

import { motion } from 'framer-motion';

const packageJson = [
  { id: 'open', line: '{' },
  { id: 'name', line: '  "name": "@your-org/your-tools",' },
  { id: 'version', line: '  "version": "1.0.0",' },
  { id: 'keywords-open', line: '  "keywords": [' },
  { id: 'keyword', line: '    "tpmjs"' },
  { id: 'keywords-close', line: '  ],' },
  { id: 'tpmjs-open', line: '  "tpmjs": {' },
  { id: 'tools-open', line: '    "tools": [{ ... }]' },
  { id: 'tpmjs-close', line: '  }' },
  { id: 'close', line: '}' },
];

export function PackageSetupSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Package Setup</h2>
        <p className="text-xl text-white/50 mb-10">Two things: a keyword and a tpmjs field</p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* package.json */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <div className="text-xs text-emerald-400/60 font-mono mb-2">package.json</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-sm">
              {packageJson.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.line.includes('tpmjs')
                      ? 'text-cyan-400'
                      : item.line.includes('"tpmjs"')
                        ? 'text-purple-400'
                        : item.line.includes('tools')
                          ? 'text-emerald-400'
                          : 'text-white/60'
                  }
                >
                  {item.line}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Explanation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left space-y-4"
          >
            <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/20">
              <div className="text-sm font-medium text-cyan-400 mb-1">tpmjs keyword</div>
              <div className="text-xs text-white/50">Required. This is how we find you on npm.</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
              <div className="text-sm font-medium text-purple-400 mb-1">tpmjs field</div>
              <div className="text-xs text-white/50">
                Defines your tools: name, description, schemas.
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-emerald-500/20">
              <div className="text-sm font-medium text-emerald-400 mb-1">tools array</div>
              <div className="text-xs text-white/50">One entry per exported tool function.</div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

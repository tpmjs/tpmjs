'use client';

import { motion } from 'framer-motion';

const packageJsonLines = [
  { id: 'open', line: '{' },
  { id: 'name', line: '  "name": "@your-org/your-tools",' },
  { id: 'keywords', line: '  "keywords": ["tpmjs"],' },
  { id: 'tpmjs', line: '  "tpmjs": {' },
  { id: 'tools', line: '    "tools": [{' },
  { id: 'toolName', line: '      "name": "yourTool",' },
  { id: 'desc', line: '      "description": "Does something useful"' },
  { id: 'closeArr', line: '    }]' },
  { id: 'closeTpmjs', line: '  }' },
  { id: 'close', line: '}' },
];

const steps = [
  { step: '1', text: 'Add tpmjs keyword', color: 'cyan' },
  { step: '2', text: 'Define tpmjs field with tool metadata', color: 'purple' },
  { step: '3', text: 'npm publish', color: 'emerald' },
];

export function GetStartedSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-[100px]"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Publish Your Tool</h2>
        <p className="text-xl text-white/50 mb-10">
          Add keyword. Define metadata. Publish. Indexed in 2 minutes.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* package.json */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <div className="text-xs text-cyan-400/60 font-mono mb-2">package.json</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-sm">
              {packageJsonLines.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.line.includes('tpmjs')
                      ? 'text-cyan-400'
                      : item.line.includes('tpmjs')
                        ? 'text-purple-400'
                        : item.line.includes('name') || item.line.includes('description')
                          ? 'text-emerald-400'
                          : 'text-white/60'
                  }
                >
                  {item.line}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left"
          >
            <div className="text-xs text-white/40 font-mono mb-2">three steps</div>
            <div className="space-y-3">
              {steps.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                      item.color === 'cyan'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : item.color === 'purple'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.step}
                  </span>
                  <span className="text-sm text-white/70">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <code className="text-emerald-400 text-sm">npm publish</code>
              <div className="text-xs text-white/40 mt-1">That&apos;s it. We find you.</div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <a
            href="https://tpmjs.com/tool-search"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Browse Registry
          </a>
          <a
            href="https://tpmjs.com/playground"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors"
          >
            Try Playground
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

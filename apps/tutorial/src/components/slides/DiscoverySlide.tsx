'use client';

import { motion } from 'framer-motion';

const searchSchema = [
  '  query: z.string(),',
  '  category?: z.enum([...]),',
  '  limit?: z.number().max(20),',
];

const responseExample = [
  { id: 'open', line: '{' },
  { id: 'tools', line: '  "tools": [{' },
  { id: 'toolId', line: '    "toolId": "@tpmjs/markdown::formatTable",' },
  { id: 'desc', line: '    "description": "Format markdown tables",' },
  { id: 'schema', line: '    "inputSchema": { ... },' },
  { id: 'score', line: '    "qualityScore": 0.92' },
  { id: 'closeArr', line: '  }]' },
  { id: 'close', line: '}' },
];

export function DiscoverySlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">searchTpmjsToolsTool</h2>
        <p className="text-xl text-white/50 mb-10">
          Agent describes what it needs. Registry returns matches.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-xs text-cyan-400/60 font-mono mb-2">inputSchema</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-sm">
              <div className="text-white/40">{'z.object({'}</div>
              {searchSchema.map((line) => (
                <div key={line} className="text-cyan-400 pl-2">
                  {line}
                </div>
              ))}
              <div className="text-white/40">{'})'}</div>
            </div>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-xs text-emerald-400/60 font-mono mb-2">returns</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-sm">
              {responseExample.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.line.includes('toolId')
                      ? 'text-emerald-400'
                      : item.line.includes('qualityScore')
                        ? 'text-yellow-400'
                        : 'text-white/60'
                  }
                >
                  {item.line}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-white/40 text-sm"
        >
          BM25 search over 200+ tools. Ranked by relevance and quality score.
        </motion.div>
      </motion.div>
    </div>
  );
}

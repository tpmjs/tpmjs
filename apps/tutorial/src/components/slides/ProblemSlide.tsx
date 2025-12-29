'use client';

import { motion } from 'framer-motion';

const codeLines = [
  "import { weatherTool } from './tools/weather';",
  "import { searchTool } from './tools/search';",
  "import { calendarTool } from './tools/calendar';",
  "import { emailTool } from './tools/email';",
  '// ... 47 more imports',
  '',
  'const result = await generateText({',
  "  model: openai('gpt-4-turbo'),",
  '  tools: { weather, search, calendar, email, ... },',
  '});',
];

export function ProblemSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-red-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">AI SDK Tools Are Static</h2>
        <p className="text-xl text-white/50 mb-12">
          You import them. You bundle them. They&apos;re compiled in.
        </p>

        {/* Code block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto text-left"
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-[#1e1e2e] rounded-t-xl border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-4 text-xs text-white/30 font-mono">agent.ts</span>
          </div>
          <div className="bg-[#1e1e2e] p-6 rounded-b-xl overflow-x-auto">
            {codeLines.map((line, i) => (
              <motion.div
                key={line || `empty-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`font-mono text-sm leading-relaxed ${
                  line.startsWith('import')
                    ? 'text-purple-400'
                    : line.startsWith('//')
                      ? 'text-white/30'
                      : line.includes('generateText')
                        ? 'text-cyan-400'
                        : 'text-white/70'
                }`}
              >
                {line || '\u00A0'}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {['Every tool compiled in', 'Bundle grows forever', 'No runtime discovery'].map(
            (text) => (
              <span
                key={text}
                className="px-3 py-1.5 rounded-full border border-orange-500/30 text-orange-400/70 text-sm font-mono"
              >
                {text}
              </span>
            )
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

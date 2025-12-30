'use client';

import { motion } from 'framer-motion';

export function WriteToolSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-amber-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-orange-400/60 font-mono text-sm mb-4">Step 2</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Write Your Tool</h2>
        <p className="text-xl text-white/50 mb-8">
          Define schema, description, and execute function
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">src/index.ts</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-purple-400">import</span>
              <span className="text-white">{' { tool } '}</span>
              <span className="text-purple-400">from</span>
              <span className="text-amber-300">{" 'ai'"}</span>
              <span className="text-white">;</span>
              {'\n'}
              <span className="text-purple-400">import</span>
              <span className="text-white">{' { z } '}</span>
              <span className="text-purple-400">from</span>
              <span className="text-amber-300">{" 'zod'"}</span>
              <span className="text-white">;</span>
              {'\n\n'}
              <span className="text-purple-400">export const</span>
              <span className="text-cyan-400"> greetingTool</span>
              <span className="text-white"> = </span>
              <span className="text-yellow-400">tool</span>
              <span className="text-white">{'({'}</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">description</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">'Generate a greeting'</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">parameters</span>
              <span className="text-white">: z.</span>
              <span className="text-yellow-400">object</span>
              <span className="text-white">{'({'}</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-cyan-400">name</span>
              <span className="text-white">: z.</span>
              <span className="text-yellow-400">string</span>
              <span className="text-white">().</span>
              <span className="text-yellow-400">describe</span>
              <span className="text-white">(</span>
              <span className="text-amber-300">'Name'</span>
              <span className="text-white">),</span>
              {'\n'}
              <span className="text-white">{'  }'}),</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">execute</span>
              <span className="text-white">: </span>
              <span className="text-purple-400">async</span>
              <span className="text-white">{' ({ name }) => {'}</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-purple-400">return</span>
              <span className="text-white"> </span>
              <span className="text-amber-300">`Hello, </span>
              <span className="text-white">{'${'}</span>
              <span className="text-cyan-400">name</span>
              <span className="text-white">{'}'}</span>
              <span className="text-amber-300">!`</span>
              <span className="text-white">;</span>
              {'\n'}
              <span className="text-white">{'  },'}</span>
              {'\n'}
              <span className="text-white">{'});'}</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-white/40 text-sm font-mono"
        >
          The AI SDK tool() wrapper makes it compatible with generateText()
        </motion.div>
      </motion.div>
    </div>
  );
}

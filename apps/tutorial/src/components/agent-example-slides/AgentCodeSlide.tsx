'use client';

import { motion } from 'framer-motion';

export function AgentCodeSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-pink-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <div className="text-rose-400/60 font-mono text-sm mb-4">Step 2</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">The Agent Loop</h2>
        <p className="text-xl text-white/50 mb-6">Pass meta-tools to generateText with maxSteps</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-5 text-left max-w-3xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">agent.ts</div>
          <pre className="text-xs font-mono overflow-x-auto leading-relaxed">
            <code>
              <span className="text-purple-400">const</span>
              <span className="text-white"> result = </span>
              <span className="text-purple-400">await</span>
              <span className="text-yellow-400"> generateText</span>
              <span className="text-white">{'({'}</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">model</span>
              <span className="text-white">: </span>
              <span className="text-yellow-400">openai</span>
              <span className="text-white">(</span>
              <span className="text-amber-300">'gpt-4o'</span>
              <span className="text-white">),</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">tools</span>
              <span className="text-white">{': {'}</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-cyan-400">search</span>
              <span className="text-white">: </span>
              <span className="text-rose-400">searchTpmjsToolsTool</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-cyan-400">execute</span>
              <span className="text-white">: </span>
              <span className="text-rose-400">registryExecuteTool</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  },'}</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">maxSteps</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">10</span>
              <span className="text-white">,</span>
              <span className="text-white/50">{' // Allow multiple tool calls'}</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">system</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">`You are an assistant that can find and use</span>
              {'\n'}
              <span className="text-amber-300">
                {' '}
                tools from the TPMJS registry. First search for
              </span>
              {'\n'}
              <span className="text-amber-300"> relevant tools, then execute them.`</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">prompt</span>
              <span className="text-white">: userRequest,</span>
              {'\n'}
              <span className="text-white">{'});'}</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 max-w-lg mx-auto"
        >
          <p className="text-rose-400 text-sm">
            <span className="font-semibold">Key:</span> maxSteps allows the agent to search, then
            execute, then reason about results
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

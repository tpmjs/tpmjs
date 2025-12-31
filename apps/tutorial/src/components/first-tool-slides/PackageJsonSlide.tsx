'use client';

import { motion } from 'framer-motion';

export function PackageJsonSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-amber-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="text-orange-400/60 font-mono text-sm mb-4">Step 3</div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Configure package.json</h2>
        <p className="text-xl text-white/50 mb-8">Add the tpmjs keyword for discovery</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117] rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto"
        >
          <div className="text-xs text-white/40 font-mono mb-3">package.json</div>
          <pre className="text-sm font-mono overflow-x-auto">
            <code>
              <span className="text-white">{'{'}</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">{'"name"'}</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">{'"my-ai-tool"'}</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">{'"version"'}</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">{'"1.0.0"'}</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">{'"keywords"'}</span>
              <span className="text-white">: [</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-amber-300 bg-orange-500/20 px-1 rounded">{'"tpmjs"'}</span>
              <span className="text-white/50">{' ← Required for discovery'}</span>
              {'\n'}
              <span className="text-white">{'  ],'}]</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">{'"main"'}</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">{'"dist/index.js"'}</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">{'"types"'}</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">{'"dist/index.d.ts"'}</span>
              <span className="text-white">,</span>
              {'\n'}
              <span className="text-white">{'  '}</span>
              <span className="text-cyan-400">{'"exports"'}</span>
              <span className="text-white">{': {'}</span>
              {'\n'}
              <span className="text-white">{'    '}</span>
              <span className="text-cyan-400">{'"."'}</span>
              <span className="text-white">: </span>
              <span className="text-amber-300">{'"./dist/index.js"'}</span>
              {'\n'}
              <span className="text-white">{'  }'}</span>
              {'\n'}
              <span className="text-white">{'}'}</span>
            </code>
          </pre>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 max-w-md mx-auto"
        >
          <p className="text-orange-400 text-sm">
            <span className="font-semibold">Key:</span> The{' '}
            <code className="bg-orange-500/20 px-1 rounded">tpmjs</code> keyword triggers automatic
            indexing
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';

const components = [
  {
    name: 'npm Sync',
    description: 'Monitors npm changes feed every 2 minutes',
    detail: 'Catches new packages with tpmjs-tool keyword',
    icon: '🔄',
  },
  {
    name: 'Schema Extraction',
    description: 'Extracts Zod schemas to JSON Schema',
    detail: 'Supports AI SDK, Zod v3, and Zod v4',
    icon: '📋',
  },
  {
    name: 'Quality Scoring',
    description: 'Ranks tools by tier, downloads, and stars',
    detail: 'Rich metadata = higher visibility',
    icon: '⭐',
  },
  {
    name: 'Sandbox Executor',
    description: 'Runs tools in isolated Deno environment',
    detail: 'No installs, secure by default',
    icon: '🏖️',
  },
];

export function ArchitectureSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-emerald-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Under the Hood</h2>
        <p className="text-xl text-white/50 mb-10">Four core systems working together</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {components.map((component, index) => (
            <motion.div
              key={component.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="p-5 rounded-xl bg-white/5 border border-cyan-500/20 text-left"
            >
              <div className="text-3xl mb-3">{component.icon}</div>
              <div className="text-sm font-semibold text-cyan-400 mb-2">{component.name}</div>
              <div className="text-xs text-white/60 mb-2">{component.description}</div>
              <div className="text-xs text-white/30 font-mono">{component.detail}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex items-center justify-center gap-4 text-white/40 text-xs font-mono"
        >
          <span className="px-2 py-1 rounded bg-white/5">PostgreSQL</span>
          <span className="text-white/20">+</span>
          <span className="px-2 py-1 rounded bg-white/5">Prisma</span>
          <span className="text-white/20">+</span>
          <span className="px-2 py-1 rounded bg-white/5">Next.js</span>
          <span className="text-white/20">+</span>
          <span className="px-2 py-1 rounded bg-white/5">Deno</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

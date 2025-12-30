'use client';

import { motion } from 'framer-motion';

const resources = [
  {
    title: 'Browse Tools',
    description: 'Explore 200+ tools in the registry',
    href: 'https://tpmjs.com',
    icon: '🔍',
  },
  {
    title: 'For Agents',
    description: 'Learn to use search and execute',
    href: '/agents',
    icon: '🤖',
    internal: true,
  },
  {
    title: 'For Authors',
    description: 'Publish your tools to the registry',
    href: '/authors',
    icon: '📦',
    internal: true,
  },
  {
    title: 'GitHub',
    description: 'View the source code',
    href: 'https://github.com/tpmjs/tpmjs',
    icon: '💻',
  },
];

export function ExploreSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-cyan-900/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Start Exploring</h2>
        <p className="text-xl text-white/50 mb-12">Choose your next step</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {resources.map((resource, index) => (
            <motion.a
              key={resource.title}
              href={resource.href}
              target={resource.internal ? undefined : '_blank'}
              rel={resource.internal ? undefined : 'noopener noreferrer'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-5 rounded-xl bg-white/5 border border-emerald-500/20 text-left hover:bg-white/10 hover:border-emerald-500/40 transition-all group cursor-pointer"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                {resource.icon}
              </div>
              <div className="text-sm font-semibold text-emerald-400 mb-1">{resource.title}</div>
              <div className="text-xs text-white/50">{resource.description}</div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 max-w-md mx-auto"
        >
          <p className="text-white/70 text-sm mb-2">Ready to try it?</p>
          <code className="text-emerald-400 font-mono text-sm">
            npm install @tpmjs/search-registry
          </code>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-white/30 text-xs font-mono"
        >
          tpmjs.com — The tool registry for AI agents
        </motion.div>
      </motion.div>
    </div>
  );
}
